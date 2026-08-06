# native/

The `overlay_window` N-API addon: window tracking (attach/focus/move-resize of the
Riot Client window) plus the UI Automation calls that drive its login form.

Vendored from [electron-overlay-window](https://github.com/SnosMe/electron-overlay-window)
(via FlayInAHook/electron-overlay-window-margin), reduced to Windows only and to the
API Shunpo actually calls. See [LICENSE](LICENSE).

Built by `bun run build:native` (also runs on `postinstall`), which runs `node-gyp
rebuild` here and copies `build/Release/overlay_window.node` to `resources/`, where the
main process loads it from.
