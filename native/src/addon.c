// Derived from electron-overlay-window (MIT, Copyright (c) 2020 Alexander Drozdov).
// Reduced to Windows and to the API Shunpo uses. See ../LICENSE.
#include <stdlib.h>
#include <string.h>
#include <node_api.h>
#include "napi_helpers.h"
#include "overlay_window.h"

static napi_threadsafe_function threadsafe_fn = NULL;

void ow_emit_event(struct ow_event* event) {
  if (threadsafe_fn == NULL) return;

  struct ow_event* copied_event = malloc(sizeof(struct ow_event));
  memcpy(copied_event, event, sizeof(struct ow_event));

  napi_status status = napi_call_threadsafe_function(threadsafe_fn, copied_event, napi_tsfn_nonblocking);
  if (status == napi_closing) {
    threadsafe_fn = NULL;
    free(copied_event);
    return;
  }
  NAPI_FATAL_IF_FAILED(status, "ow_emit_event", "napi_call_threadsafe_function");
}

napi_value ow_event_to_js_object(napi_env env, struct ow_event* event) {
  napi_status status;

  napi_value event_obj;
  status = napi_create_object(env, &event_obj);
  NAPI_FATAL_IF_FAILED(status, "ow_event_to_js_object", "napi_create_object");

  napi_value e_type;
  status = napi_create_uint32(env, event->type, &e_type);
  NAPI_FATAL_IF_FAILED(status, "ow_event_to_js_object", "napi_create_uint32");

  if (event->type == OW_ATTACH || event->type == OW_MOVERESIZE) {
    napi_value e_x;
    status = napi_create_int32(env, event->bounds.x, &e_x);
    NAPI_FATAL_IF_FAILED(status, "ow_event_to_js_object", "napi_create_int32");

    napi_value e_y;
    status = napi_create_int32(env, event->bounds.y, &e_y);
    NAPI_FATAL_IF_FAILED(status, "ow_event_to_js_object", "napi_create_int32");

    napi_value e_width;
    status = napi_create_uint32(env, event->bounds.width, &e_width);
    NAPI_FATAL_IF_FAILED(status, "ow_event_to_js_object", "napi_create_uint32");

    napi_value e_height;
    status = napi_create_uint32(env, event->bounds.height, &e_height);
    NAPI_FATAL_IF_FAILED(status, "ow_event_to_js_object", "napi_create_uint32");

    napi_property_descriptor descriptors[] = {
      { "type",   NULL, NULL, NULL, NULL, e_type,   napi_enumerable, NULL },
      { "x",      NULL, NULL, NULL, NULL, e_x,      napi_enumerable, NULL },
      { "y",      NULL, NULL, NULL, NULL, e_y,      napi_enumerable, NULL },
      { "width",  NULL, NULL, NULL, NULL, e_width,  napi_enumerable, NULL },
      { "height", NULL, NULL, NULL, NULL, e_height, napi_enumerable, NULL },
    };
    status = napi_define_properties(env, event_obj, sizeof(descriptors) / sizeof(descriptors[0]), descriptors);
    NAPI_FATAL_IF_FAILED(status, "ow_event_to_js_object", "napi_define_properties");
    return event_obj;
  }
  else {
    napi_property_descriptor descriptors[] = {
      { "type", NULL, NULL, NULL, NULL, e_type, napi_enumerable, NULL },
    };
    status = napi_define_properties(env, event_obj, sizeof(descriptors) / sizeof(descriptors[0]), descriptors);
    NAPI_FATAL_IF_FAILED(status, "ow_event_to_js_object", "napi_define_properties");
    return event_obj;
  }
}

void tsfn_to_js_proxy(napi_env env, napi_value js_callback, void* context, void* _event) {
  struct ow_event* event = (struct ow_event*)_event;
  napi_status status;

  napi_value event_obj = ow_event_to_js_object(env, event);

  napi_value global;
  status = napi_get_global(env, &global);
  NAPI_FATAL_IF_FAILED(status, "tsfn_to_js_proxy", "napi_get_global");

  status = napi_call_function(env, global, js_callback, 1, &event_obj, NULL);
  NAPI_FATAL_IF_FAILED(status, "tsfn_to_js_proxy", "napi_call_function");

  free(event);
}

napi_value AddonStart(napi_env env, napi_callback_info info) {
  napi_status status;

  size_t info_argc = 2;
  napi_value info_argv[2];
  status = napi_get_cb_info(env, info, &info_argc, info_argv, NULL, NULL);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  // [0] Target Window title
  size_t target_window_title_length;
  status = napi_get_value_string_utf8(env, info_argv[0], NULL, 0, &target_window_title_length);
  NAPI_THROW_IF_FAILED(env, status, NULL);
  char* target_window_title = malloc(sizeof(char) * target_window_title_length + 1);
  status = napi_get_value_string_utf8(env, info_argv[0], target_window_title, target_window_title_length + 1, NULL);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  // [1] Event callback
  napi_value async_resource_name;
  status = napi_create_string_utf8(env, "OVERLAY_WINDOW", NAPI_AUTO_LENGTH, &async_resource_name);
  NAPI_THROW_IF_FAILED(env, status, NULL);
  status = napi_create_threadsafe_function(env, info_argv[1], NULL, async_resource_name, 0, 1, NULL, NULL, NULL, tsfn_to_js_proxy, &threadsafe_fn);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  ow_start_hook(target_window_title);

  return NULL;
}

napi_value AddonFocusTarget(napi_env env, napi_callback_info info) {
  ow_focus_target();
  return NULL;
}

static napi_value controls_result_to_js_object(napi_env env, ow_controls_result result) {
  napi_status status;

  napi_value result_obj;
  status = napi_create_object(env, &result_obj);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  napi_value found_val;
  status = napi_get_boolean(env, result.found, &found_val);
  NAPI_THROW_IF_FAILED(env, status, NULL);
  status = napi_set_named_property(env, result_obj, "found", found_val);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  napi_value count_val;
  status = napi_create_int32(env, result.count, &count_val);
  NAPI_THROW_IF_FAILED(env, status, NULL);
  status = napi_set_named_property(env, result_obj, "count", count_val);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  return result_obj;
}

napi_value AddonFindEditControls(napi_env env, napi_callback_info info) {
  return controls_result_to_js_object(env, ow_find_edit_controls());
}

napi_value AddonFindButtonsWithImages(napi_env env, napi_callback_info info) {
  return controls_result_to_js_object(env, ow_find_buttons_with_images());
}

napi_value AddonInputTextToEdit(napi_env env, napi_callback_info info) {
  napi_status status;

  size_t argc = 2;
  napi_value args[2];
  status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  if (argc < 2) {
    napi_throw_error(env, NULL, "Expected 2 arguments: editIndex and text");
    return NULL;
  }

  int32_t edit_index;
  status = napi_get_value_int32(env, args[0], &edit_index);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  size_t text_length;
  status = napi_get_value_string_utf8(env, args[1], NULL, 0, &text_length);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  char* text = malloc(text_length + 1);
  status = napi_get_value_string_utf8(env, args[1], text, text_length + 1, NULL);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  int result = ow_input_text_to_edit(edit_index, text);
  free(text);

  napi_value return_val;
  status = napi_get_boolean(env, result, &return_val);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  return return_val;
}

napi_value AddonClickButtonWithImage(napi_env env, napi_callback_info info) {
  napi_status status;

  size_t argc = 1;
  napi_value args[1];
  status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  if (argc < 1) {
    napi_throw_error(env, NULL, "Expected 1 argument: buttonIndex");
    return NULL;
  }

  int32_t button_index;
  status = napi_get_value_int32(env, args[0], &button_index);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  int result = ow_click_button_with_image(button_index);

  napi_value return_val;
  status = napi_get_boolean(env, result, &return_val);
  NAPI_THROW_IF_FAILED(env, status, NULL);

  return return_val;
}

static void export_fn(napi_env env, napi_value exports, const char* name, napi_callback cb) {
  napi_status status;
  napi_value fn;

  status = napi_create_function(env, NULL, 0, cb, NULL, &fn);
  NAPI_FATAL_IF_FAILED(status, "export_fn", "napi_create_function");
  status = napi_set_named_property(env, exports, name, fn);
  NAPI_FATAL_IF_FAILED(status, "export_fn", "napi_set_named_property");
}

NAPI_MODULE_INIT() {
  export_fn(env, exports, "start", AddonStart);
  export_fn(env, exports, "focusTarget", AddonFocusTarget);
  export_fn(env, exports, "findEditControls", AddonFindEditControls);
  export_fn(env, exports, "inputTextToEdit", AddonInputTextToEdit);
  export_fn(env, exports, "findButtonsWithImages", AddonFindButtonsWithImages);
  export_fn(env, exports, "clickButtonWithImage", AddonClickButtonWithImage);
  return exports;
}
