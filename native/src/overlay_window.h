// Derived from electron-overlay-window (MIT, Copyright (c) 2020 Alexander Drozdov).
// Reduced to Windows and to the API Shunpo uses. See ../LICENSE.
#ifndef ADDON_SRC_OVERLAY_WINDOW_H_
#define ADDON_SRC_OVERLAY_WINDOW_H_

#include <stdint.h>
#include <uv.h>

enum ow_event_type {
  // target window is found
  OW_ATTACH = 1,
  // target window is active/foreground
  OW_FOCUS,
  // target window lost focus
  OW_BLUR,
  // target window is destroyed
  OW_DETACH,
  // target window changed position or resized
  OW_MOVERESIZE,
};

struct ow_window_bounds {
  int32_t x;
  int32_t y;
  uint32_t width;
  uint32_t height;
};

struct ow_event {
  enum ow_event_type type;
  struct ow_window_bounds bounds;
};

static uv_thread_t hook_tid;

void ow_start_hook(char* target_window_title);

void ow_focus_target();

void ow_emit_event(struct ow_event* event);

typedef struct {
  int found;
  int count;
} ow_controls_result;

// Find Edit controls (ControlType 50004) in the target window
ow_controls_result ow_find_edit_controls();

// Input text into a specific Edit control by index (0-based)
int ow_input_text_to_edit(int edit_index, const char* text);

// Find Button controls (ControlType 50000) that have Image children (50006)
ow_controls_result ow_find_buttons_with_images();

// Click a specific Button control that has an Image child by index (0-based)
int ow_click_button_with_image(int button_index);

#endif
