// Derived from electron-overlay-window (MIT, Copyright (c) 2020 Alexander Drozdov).
// Reduced to the API Shunpo uses. See ../LICENSE.
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <stdbool.h>
#define _WIN32_DCOM
#include <Windows.h>
#include <oleacc.h>
#include <UIAutomation.h>
#include "overlay_window.h"

#define OW_FOREGROUND_TIMER_MS 83 // 12 fps
#define OW_MAX_EDIT_ELEMENTS 2
#define OW_MAX_BUTTON_ELEMENTS 10

struct ow_target_window
{
  char* title;
  HWND hwnd;
  HWINEVENTHOOK location_hook;
  HWINEVENTHOOK destroy_hook;
  bool is_focused;
  bool is_destroyed;
};

static HWND foreground_window = NULL;
static HWINEVENTHOOK fg_window_namechange_hook = NULL;

static struct ow_target_window target_info = {
  .title = NULL,
  .hwnd = NULL,
  .location_hook = NULL,
  .destroy_hook = NULL,
  .is_focused = false,
  .is_destroyed = false
};

// UI Automation globals
static IUIAutomation* g_pAutomation = NULL;
static IUIAutomationElement* g_pEditElements[OW_MAX_EDIT_ELEMENTS] = {NULL};
static int g_editElementsCount = 0;
static IUIAutomationElement* g_pButtonWithImageElements[OW_MAX_BUTTON_ELEMENTS] = {NULL};
static int g_buttonWithImageElementsCount = 0;

static VOID CALLBACK hook_proc(HWINEVENTHOOK, DWORD, HWND, LONG, LONG, DWORD, DWORD);

static bool get_title(HWND hwnd, char** title) {
  SetLastError(0);
  int titleLength = GetWindowTextLengthW(hwnd);
  if (titleLength == 0) {
    if (GetLastError() != 0) {
      return false;
    }
    else {
      *title = NULL;
      return true;
    }
  }

  LPWSTR titleUtf16 = malloc(sizeof(WCHAR) * ((size_t)titleLength + 1));
  if (GetWindowTextW(hwnd, titleUtf16, titleLength + 1) == FALSE) {
    free(titleUtf16);
    return false;
  }
  int buffLenUtf8 = WideCharToMultiByte(CP_UTF8, 0, titleUtf16, -1, NULL, 0, NULL, NULL);
  if (buffLenUtf8 == FALSE) {
    free(titleUtf16);
    return false;
  }
  *title = malloc(buffLenUtf8);
  if (WideCharToMultiByte(CP_UTF8, 0, titleUtf16, -1, *title, buffLenUtf8, NULL, NULL) == FALSE) {
    free(titleUtf16);
    free(*title);
    return false;
  }
  return true;
}

static bool get_content_bounds(HWND hwnd, struct ow_window_bounds* bounds) {
  RECT rect;
  if (GetClientRect(hwnd, &rect) == FALSE) {
    return false;
  }

  POINT ptClientUL = {
    .x = rect.left,
    .y = rect.top
  };
  if (ClientToScreen(hwnd, &ptClientUL) == FALSE) {
    return false;
  }

  bounds->x = ptClientUL.x;
  bounds->y = ptClientUL.y;
  bounds->width = rect.right;
  bounds->height = rect.bottom;
  return true;
}

static bool MSAA_check_window_focused_state(HWND hwnd) {
  HRESULT hr;
  IAccessible* pAcc = NULL;
  VARIANT varChildSelf;
  VariantInit(&varChildSelf);
  hr = AccessibleObjectFromEvent(hwnd, OBJID_WINDOW, CHILDID_SELF, &pAcc, &varChildSelf);
  if (hr != S_OK || pAcc == NULL) {
    VariantClear(&varChildSelf);
    return false;
  }
  VARIANT varState;
  VariantInit(&varState);
  hr = pAcc->lpVtbl->get_accState(pAcc, varChildSelf, &varState);

  bool is_focused = false;
  if (hr == S_OK && varState.vt == VT_I4) {
    is_focused = (varState.lVal & STATE_SYSTEM_FOCUSED);
  }
  VariantClear(&varState);
  VariantClear(&varChildSelf);
  pAcc->lpVtbl->Release(pAcc);
  return is_focused;
}

static void handle_movesize_event(struct ow_target_window* target_info) {
  struct ow_event e = { .type = OW_MOVERESIZE };
  if (get_content_bounds(target_info->hwnd, &e.bounds)) {
    ow_emit_event(&e);
  }
}

static void check_and_handle_window(HWND hwnd, struct ow_target_window* target_info) {
  // ignore fake ghost windows
  if (IsHungAppWindow(hwnd)) {
    return;
  }

  if (target_info->hwnd != NULL) {
    if (target_info->hwnd != hwnd) {
      if (target_info->is_focused) {
        target_info->is_focused = false;
        struct ow_event e = { .type = OW_BLUR };
        ow_emit_event(&e);
      }

      if (target_info->is_destroyed) {
        target_info->hwnd = NULL;
        target_info->is_destroyed = false;
        struct ow_event e = { .type = OW_DETACH };
        ow_emit_event(&e);
      }
    }
    else if (target_info->hwnd == hwnd) {
      if (!target_info->is_focused) {
        target_info->is_focused = true;
        struct ow_event e = { .type = OW_FOCUS };
        ow_emit_event(&e);
      }
      return;
    }
  }

  char* title = NULL;
  if (!get_title(hwnd, &title) || title == NULL) {
    return;
  }
  bool is_equal = (strcmp(title, target_info->title) == 0);
  free(title);
  if (!is_equal) {
    return;
  }

  if (target_info->hwnd != NULL) {
    UnhookWinEvent(target_info->location_hook);
    UnhookWinEvent(target_info->destroy_hook);
  }

  target_info->hwnd = hwnd;

  DWORD pid;
  DWORD threadId = GetWindowThreadProcessId(target_info->hwnd, &pid);
  if (threadId == 0) {
    return;
  }

  target_info->location_hook = SetWinEventHook(
    EVENT_OBJECT_LOCATIONCHANGE, EVENT_OBJECT_LOCATIONCHANGE,
    NULL, hook_proc, 0, threadId,
    WINEVENT_OUTOFCONTEXT);
  target_info->destroy_hook = SetWinEventHook(
    EVENT_OBJECT_DESTROY, EVENT_OBJECT_DESTROY,
    NULL, hook_proc, 0, threadId,
    WINEVENT_OUTOFCONTEXT);

  struct ow_event e = { .type = OW_ATTACH };
  if (get_content_bounds(target_info->hwnd, &e.bounds)) {
    // emit OW_ATTACH
    ow_emit_event(&e);

    target_info->is_focused = true;
    e.type = OW_FOCUS;
    ow_emit_event(&e);
  }
  else {
    // something went wrong, did the target window die right after becoming active?
    target_info->hwnd = NULL;
  }
}

void handle_new_foreground(HWND hwnd) {
  foreground_window = hwnd;

  if (fg_window_namechange_hook != NULL) {
    UnhookWinEvent(fg_window_namechange_hook);
    fg_window_namechange_hook = NULL;
  }
  if (foreground_window != NULL && foreground_window != target_info.hwnd) {
    fg_window_namechange_hook = SetWinEventHook(
      EVENT_OBJECT_NAMECHANGE, EVENT_OBJECT_NAMECHANGE,
      NULL, hook_proc, 0, GetWindowThreadProcessId(foreground_window, NULL),
      WINEVENT_OUTOFCONTEXT);
  }
  check_and_handle_window(foreground_window, &target_info);
}

static VOID CALLBACK hook_proc(
  HWINEVENTHOOK hWinEventHook, DWORD event, HWND hwnd, LONG idObject, LONG idChild,
  DWORD idEventThread, DWORD dwmsEventTime
) {
  if (event == EVENT_OBJECT_DESTROY) {
    if (hwnd == target_info.hwnd && idObject == OBJID_WINDOW && idChild == CHILDID_SELF) {
      target_info.is_destroyed = true;
      check_and_handle_window(NULL, &target_info);
    }
    return;
  }
  if (event == EVENT_OBJECT_LOCATIONCHANGE) {
    if (hwnd == target_info.hwnd && idObject == OBJID_WINDOW && idChild == CHILDID_SELF) {
      handle_movesize_event(&target_info);
    }
    return;
  }
  if (event == EVENT_OBJECT_NAMECHANGE) {
    if (hwnd == foreground_window && idObject == OBJID_WINDOW && idChild == CHILDID_SELF) {
      check_and_handle_window(foreground_window, &target_info);
    }
    return;
  }
  if (event == EVENT_SYSTEM_FOREGROUND || event == EVENT_SYSTEM_MINIMIZEEND) {
    // checks if window is really gained focus
    // REASON: if multiple foreground windows switching too fast in short period,
    //         Windows sends EVENT_SYSTEM_FOREGROUND for them but MAY NOT actually
    //         focus window, so the focus is left on previous foreground window,
    //         but from the point of hook we think that focus is changed.
    if (GetForegroundWindow() != hwnd && !MSAA_check_window_focused_state(hwnd)) {
      // false positive
      return;
    }

    handle_new_foreground(hwnd);
    return;
  }
}

static VOID CALLBACK foreground_timer_proc(HWND _hwnd, UINT msg, UINT_PTR timerId, DWORD dwmsEventTime)
{
  HWND system_foreground = GetForegroundWindow();

  if (
    foreground_window != system_foreground &&
    MSAA_check_window_focused_state(system_foreground)
  ) {
    handle_new_foreground(system_foreground);
  }
}

static void hook_thread(void* _arg) {
  SetWinEventHook(
    EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND,
    NULL, hook_proc, 0, 0, WINEVENT_OUTOFCONTEXT);
  SetWinEventHook(
    EVENT_SYSTEM_MINIMIZEEND, EVENT_SYSTEM_MINIMIZEEND,
    NULL, hook_proc, 0, 0, WINEVENT_OUTOFCONTEXT);
  // FIXES: ForegroundLockTimeout (even when = 0); Also edge cases when apps stealing FG window.
  // NOTE:  Using timer because WH_SHELL & WH_CBT hooks require dll injection
  SetTimer(NULL, 0, OW_FOREGROUND_TIMER_MS, foreground_timer_proc);

  foreground_window = GetForegroundWindow();
  if (foreground_window != NULL) {
    fg_window_namechange_hook = SetWinEventHook(
      EVENT_OBJECT_NAMECHANGE, EVENT_OBJECT_NAMECHANGE,
      NULL, hook_proc, 0, GetWindowThreadProcessId(foreground_window, NULL),
      WINEVENT_OUTOFCONTEXT);
    check_and_handle_window(foreground_window, &target_info);
  }

  MSG message;
  while (GetMessageW(&message, (HWND)NULL, 0, 0) != FALSE) {
    TranslateMessage(&message);
    DispatchMessageW(&message);
  }
}

void ow_start_hook(char* target_window_title) {
  target_info.title = target_window_title;
  uv_thread_create(&hook_tid, hook_thread, NULL);
}

void ow_focus_target() {
  SetForegroundWindow(target_info.hwnd);
}

// Initialize UI Automation if not already done
static HRESULT init_ui_automation() {
  if (g_pAutomation != NULL) {
    return S_OK; // Already initialized
  }

  HRESULT hr = CoInitializeEx(NULL, COINIT_APARTMENTTHREADED);
  if (FAILED(hr)) {
    return hr;
  }

  return CoCreateInstance(&CLSID_CUIAutomation, NULL, CLSCTX_INPROC_SERVER,
                          &IID_IUIAutomation, (void**)&g_pAutomation);
}

// Ensure target window has focus for UI Automation to work properly
static void ensure_target_window_focus() {
  if (target_info.hwnd == NULL) {
    return;
  }

  // Check if window is already in foreground
  if (GetForegroundWindow() == target_info.hwnd) {
    return; // Already has focus
  }

  // Bring window to foreground
  SetForegroundWindow(target_info.hwnd);

  // Give the system a moment to process the focus change
  Sleep(100);

  // Verify the window gained focus
  if (GetForegroundWindow() != target_info.hwnd) {
    // Try alternative methods if SetForegroundWindow failed
    ShowWindow(target_info.hwnd, SW_RESTORE);
    BringWindowToTop(target_info.hwnd);
    SetActiveWindow(target_info.hwnd);
    Sleep(50);
  }
}

// Create a UIA condition matching a ControlType id (e.g. 50004 Edit, 50000 Button)
static IUIAutomationCondition* create_control_type_condition(long control_type_id) {
  IUIAutomationCondition* pCondition = NULL;
  VARIANT varControlType;
  VariantInit(&varControlType);
  varControlType.vt = VT_I4;
  varControlType.lVal = control_type_id;

  HRESULT hr = g_pAutomation->lpVtbl->CreatePropertyCondition(g_pAutomation,
                                                              UIA_ControlTypePropertyId,
                                                              varControlType,
                                                              &pCondition);
  VariantClear(&varControlType);
  return SUCCEEDED(hr) ? pCondition : NULL;
}

// Get the UIA element of the target window, or NULL. Also ensures it has focus,
// UI Automation does not reliably see the Riot Client's controls otherwise.
static IUIAutomationElement* get_focused_target_element() {
  if (target_info.hwnd == NULL) {
    return NULL;
  }

  ensure_target_window_focus();

  if (FAILED(init_ui_automation())) {
    return NULL;
  }

  IUIAutomationElement* pWindowElement = NULL;
  HRESULT hr = g_pAutomation->lpVtbl->ElementFromHandle(g_pAutomation, target_info.hwnd, &pWindowElement);
  return SUCCEEDED(hr) ? pWindowElement : NULL;
}

static void release_elements(IUIAutomationElement** elements, int max, int* count) {
  for (int i = 0; i < max; i++) {
    if (elements[i] != NULL) {
      elements[i]->lpVtbl->Release(elements[i]);
      elements[i] = NULL;
    }
  }
  *count = 0;
}

static int invoke_element(IUIAutomationElement* element) {
  IUIAutomationInvokePattern* pInvokePattern = NULL;
  HRESULT hr = element->lpVtbl->GetCurrentPatternAs(
    element, UIA_InvokePatternId, &IID_IUIAutomationInvokePattern,
    (void**)&pInvokePattern);

  if (FAILED(hr) || pInvokePattern == NULL) {
    return 0;
  }

  hr = pInvokePattern->lpVtbl->Invoke(pInvokePattern);
  pInvokePattern->lpVtbl->Release(pInvokePattern);

  return SUCCEEDED(hr) ? 1 : 0;
}

ow_controls_result ow_find_edit_controls() {
  ow_controls_result result = {0, 0};

  IUIAutomationElement* pWindowElement = get_focused_target_element();
  if (pWindowElement == NULL) {
    return result;
  }

  release_elements(g_pEditElements, OW_MAX_EDIT_ELEMENTS, &g_editElementsCount);

  IUIAutomationCondition* pCondition = create_control_type_condition(50004); // UIA_EditControlTypeId
  if (pCondition != NULL) {
    IUIAutomationElementArray* pFoundElements = NULL;
    HRESULT hr = pWindowElement->lpVtbl->FindAll(pWindowElement, TreeScope_Descendants,
                                                 pCondition, &pFoundElements);

    if (SUCCEEDED(hr) && pFoundElements != NULL) {
      int length = 0;
      hr = pFoundElements->lpVtbl->get_Length(pFoundElements, &length);

      if (SUCCEEDED(hr)) {
        result.found = 1;
        result.count = length;
        g_editElementsCount = (length > OW_MAX_EDIT_ELEMENTS) ? OW_MAX_EDIT_ELEMENTS : length;

        for (int i = 0; i < g_editElementsCount; i++) {
          if (FAILED(pFoundElements->lpVtbl->GetElement(pFoundElements, i, &g_pEditElements[i]))) {
            g_pEditElements[i] = NULL;
          }
        }
      }

      pFoundElements->lpVtbl->Release(pFoundElements);
    }

    pCondition->lpVtbl->Release(pCondition);
  }

  pWindowElement->lpVtbl->Release(pWindowElement);
  return result;
}

int ow_input_text_to_edit(int edit_index, const char* text) {
  if (edit_index < 0 || edit_index >= g_editElementsCount ||
      g_pEditElements[edit_index] == NULL || text == NULL) {
    return 0; // Failed
  }

  // Ensure target window has focus for input operations
  ensure_target_window_focus();

  // Get the Value pattern to set text
  IUIAutomationValuePattern* pValuePattern = NULL;
  HRESULT hr = g_pEditElements[edit_index]->lpVtbl->GetCurrentPatternAs(
    g_pEditElements[edit_index], UIA_ValuePatternId, &IID_IUIAutomationValuePattern,
    (void**)&pValuePattern);

  if (FAILED(hr) || pValuePattern == NULL) {
    return 0; // Failed
  }

  // Convert text to wide string
  int wide_len = MultiByteToWideChar(CP_UTF8, 0, text, -1, NULL, 0);
  if (wide_len == 0) {
    pValuePattern->lpVtbl->Release(pValuePattern);
    return 0;
  }

  WCHAR* wide_text = malloc(wide_len * sizeof(WCHAR));
  if (wide_text == NULL) {
    pValuePattern->lpVtbl->Release(pValuePattern);
    return 0;
  }

  MultiByteToWideChar(CP_UTF8, 0, text, -1, wide_text, wide_len);

  // Set the text using SysAllocString
  BSTR bstr_text = SysAllocString(wide_text);
  hr = pValuePattern->lpVtbl->SetValue(pValuePattern, bstr_text);

  SysFreeString(bstr_text);
  free(wide_text);
  pValuePattern->lpVtbl->Release(pValuePattern);

  return SUCCEEDED(hr) ? 1 : 0;
}

ow_controls_result ow_find_buttons_with_images() {
  ow_controls_result result = {0, 0};

  IUIAutomationElement* pWindowElement = get_focused_target_element();
  if (pWindowElement == NULL) {
    return result;
  }

  release_elements(g_pButtonWithImageElements, OW_MAX_BUTTON_ELEMENTS, &g_buttonWithImageElementsCount);

  IUIAutomationCondition* pButtonCondition = create_control_type_condition(50000); // UIA_ButtonControlTypeId
  IUIAutomationCondition* pImageCondition = create_control_type_condition(50006); // UIA_ImageControlTypeId

  if (pButtonCondition != NULL && pImageCondition != NULL) {
    IUIAutomationElementArray* pButtonElements = NULL;
    HRESULT hr = pWindowElement->lpVtbl->FindAll(pWindowElement, TreeScope_Descendants,
                                                 pButtonCondition, &pButtonElements);

    if (SUCCEEDED(hr) && pButtonElements != NULL) {
      int buttonCount = 0;
      hr = pButtonElements->lpVtbl->get_Length(pButtonElements, &buttonCount);

      if (SUCCEEDED(hr)) {
        // Keep only the buttons that have at least one Image child
        for (int i = 0; i < buttonCount && g_buttonWithImageElementsCount < OW_MAX_BUTTON_ELEMENTS; i++) {
          IUIAutomationElement* pButtonElement = NULL;
          hr = pButtonElements->lpVtbl->GetElement(pButtonElements, i, &pButtonElement);

          if (SUCCEEDED(hr) && pButtonElement != NULL) {
            IUIAutomationElementArray* pImageElements = NULL;
            hr = pButtonElement->lpVtbl->FindAll(pButtonElement, TreeScope_Children,
                                                 pImageCondition, &pImageElements);

            if (SUCCEEDED(hr) && pImageElements != NULL) {
              int imageCount = 0;
              hr = pImageElements->lpVtbl->get_Length(pImageElements, &imageCount);

              if (SUCCEEDED(hr) && imageCount > 0) {
                g_pButtonWithImageElements[g_buttonWithImageElementsCount] = pButtonElement;
                g_buttonWithImageElementsCount++;
                pButtonElement = NULL; // Don't release, we're keeping it
              }

              pImageElements->lpVtbl->Release(pImageElements);
            }

            if (pButtonElement != NULL) {
              pButtonElement->lpVtbl->Release(pButtonElement);
            }
          }
        }

        result.found = (g_buttonWithImageElementsCount > 0) ? 1 : 0;
        result.count = g_buttonWithImageElementsCount;
      }

      pButtonElements->lpVtbl->Release(pButtonElements);
    }
  }

  if (pButtonCondition != NULL) pButtonCondition->lpVtbl->Release(pButtonCondition);
  if (pImageCondition != NULL) pImageCondition->lpVtbl->Release(pImageCondition);

  pWindowElement->lpVtbl->Release(pWindowElement);
  return result;
}

int ow_click_button_with_image(int button_index) {
  if (button_index < 0) {
    return 0;
  }

  if (g_buttonWithImageElementsCount == 0) {
    ow_controls_result result = ow_find_buttons_with_images();
    if (!result.found || result.count == 0) {
      return 0;
    }
  }

  if (button_index >= g_buttonWithImageElementsCount ||
      g_pButtonWithImageElements[button_index] == NULL) {
    return 0;
  }

  ensure_target_window_focus();

  return invoke_element(g_pButtonWithImageElements[button_index]);
}
