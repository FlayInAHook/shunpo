# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Shunpo is an Electron desktop app (Windows-focused) that manages multiple League of Legends accounts by driving the Riot Client's login UI directly and reading data from the League Client Update (LCU) API. It renders a custom UI overlaid on top of the actual Riot Client window rather than being a wrapper around any Riot web API.

## Commands

Package manager is **bun** (see `bun.lock`, `.npmrc`) — use `bun run <script>`, not npm/yarn/pnpm.

```bash
# Dev (BUILD_TEST=true forces overlay-attach + auto-hidden-menubar behavior that's normally prod-only)
set BUILD_TEST=true && bun run dev          # cmd
$ENV:BUILD_TEST=true; bun run dev           # PowerShell

# Type checking (two separate tsconfigs: node/main+preload, web/renderer)
bun run typecheck:node
bun run typecheck:web
bun run typecheck        # both

# Lint / format
bun run lint
bun run format

# Production build (runs typecheck first)
bun run build
bun run build:win        # full Windows installer via electron-builder
bun run build:unpack     # build without packaging into an installer, for quick manual testing

# Regenerate Chakra UI theme types after editing src/renderer/src/theme/theme.ts
bun run generate:theme
```

There is no test suite/framework configured in this repo.

## Architecture

Standard electron-vite three-process layout (`electron.vite.config.ts`), but the important behavior lives in how the processes cooperate:

- `src/main/index.ts` — app lifecycle, tray, single-instance lock, auto-start-with-Windows, and the overlay window setup. On startup it attaches the main `BrowserWindow` to the actual **"Riot Client"** OS window using `electron-overlay-window` (a custom fork: `electron-overlay-window-margin`, see `dependencies` in package.json), so Shunpo's UI is visually pinned on top of the Riot Client rather than being a separate window. `pauseOverlayAttach`/`resumeOverlayAttach` IPC channels let the renderer temporarily detach (e.g. to show a normal window) and reattach.
- `src/main/riotInteractions.ts` — the core account-switching logic, in two parts:
  1. **Login automation**: `riotLogin` IPC drives the Riot Client's *own* login form using low-level win32 UI automation via `OverlayController` (`findEditControls`, `inputTextToEdit`, `findButtonsWithImages`, `clickButtonWithImage`) — this types into and clicks the real client UI, it does not call a Riot auth API. It retries once on failure.
  2. **Data gathering**: after a successful login it polls until the LCU is reachable (`HasagiClient` from `@hasagi/core`), then fetches summoner info, ranked stats, phone verification, and owned champions, and pushes them to the renderer via the `riotDataUpdate` IPC event keyed by username. It also subscribes to LCU websocket events (gameflow phase changes, owned-champions updates) to refresh this data live without the user re-triggering anything.
- `src/main/encrypt.ts` — `encryptString`/`decryptString` IPC handlers wrapping Electron's `safeStorage`. This is how account passwords are protected at rest.
- `src/main/autoUpdater.ts` — wraps `electron-updater`, exposes `check-for-updates`/`install-update`/`get-app-version` IPC, and pushes progress via an `update-status` event. Disabled entirely in dev.
- `src/preload/index.ts` — exposes `window.electron` (generic `@electron-toolkit/preload` passthrough — renderer code calls `window.electron.ipcRenderer.invoke/send/on` directly for most channels like `encryptString`, `riotLogin`, `riotDataUpdate`) and a small curated `window.api` object for the updater only. When adding new main↔renderer channels, follow the existing pattern of calling `ipcRenderer` directly from renderer code rather than adding new members to `window.api`, unless the channel is updater-related.
- `src/renderer/src/Datastorage.ts` — all app state is Jotai atoms. `accountsAtom` is the important one: its setter encrypts the account list (via the `encryptString` IPC call) before persisting to `localStorage`, and the initial value is decrypted on module load. Other atoms (`enabledColumnsAtom`, `dismissedUpdateVersionsAtom`) use plain `atomWithStorage` with no encryption — only account credentials go through the encrypt path. Account records accumulate LCU-derived fields (`rank`, `ownedChampions`, `summonerInfo`, etc.) that get merged in by the `riotDataUpdate` listener in `AccountList.tsx`, matched by `username`.
- `src/renderer/src/components/account/` — the account list/row UI, drag-to-reorder (`@dnd-kit`) and rank-based sorting live here.

## Conventions

- Renderer formatting/linting follows `.prettierrc.yaml` (single quotes, no semicolons, no trailing commas) and `eslint.config.mjs` (`@electron-toolkit` configs + React/hooks/refresh rules), but a fair amount of existing code (e.g. `src/main/riotInteractions.ts`) uses double quotes/semicolons — match the file you're editing rather than the repo-wide default when doing small edits.
- Path alias `@renderer/*` → `src/renderer/src/*` (renderer/web tsconfig only).
