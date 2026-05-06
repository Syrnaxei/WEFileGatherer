# AGENTS.md — Video File Processing V1

## Dual TypeScript build configs (easy to get wrong)

- `tsconfig.json` — plain Node.js backend (`outDir: ./dist`)
- `tsconfig.electron.json` — Electron main process (`outDir: ./dist/electron`)
- The Electron config preserves the `src/electron/` folder structure, so the compiled entry ends up at `dist/electron/electron/main.js` (nested), **not** `dist/electron/main.js`. This has caused both `package.json` `"main"` and HTML `loadFile` path bugs before.

## Frontend build must be relative-path

`web/vite.config.ts` must have `base: './'`. Without it, the built HTML uses absolute `/assets/...` paths which resolve to `file:///assets/...` inside Electron and show a blank white screen.

## Workflow mode (current version)

This is **not** a drag-and-drop node editor anymore. The current UI is a batch-processing table:
1. User puts video files in `wfp/` directory.
2. GUI "Load" button calls `POST /api/scan` to list files.
3. User enters a **tag** (output subfolder alias) per file.
4. "Start" sends the file list + tags to `POST /api/flows/:id/start`.
5. `TaggerNode` reads `ctx.metadata.userTag` and `MoverNode` resolves `{tag}` in the path template.

The old React Flow canvas components (`FlowCanvas`, `NodePanel`, `PropertyPanel`) still exist in `web/src/components/` but are **not imported** by `App.tsx`.

## Key commands

```bash
# Type-check only (run both — they have different include sets)
npx tsc --noEmit                    # plain backend
npx tsc -p tsconfig.electron.json --noEmit   # Electron main process

# Development (Electron with hot reload)
npm run electron:dev

# Production build (may fail at winCodeSign on non-admin Windows; the exe is still usable)
npm run electron:build

# Frontend dev server (standalone, for UI work without Electron)
cd web && npm run dev
```

## Native module: better-sqlite3

- Electron uses `better-sqlite3`, a native C++ addon. `electron-builder` automatically runs `@electron/rebuild` during packaging.
- The database file is created at runtime under `data/vfp.db` (or `app.getPath('userData')` in Electron).
- WAL mode is enabled (`journal_mode = WAL`).

## Electron window focus gotcha

To make `<input>` fields focusable in the packaged app:
- `BrowserWindow` must use `show: false` initially.
- Show it only in the `ready-to-show` event, then call `mainWindow.focus()` and `mainWindow.webContents.focus()`.
- The default Vite template CSS sets `#root { width: 1126px; text-align: center; }` which breaks Electron layout; `web/src/index.css` was replaced with a minimal reset.

## SQLite state machine

FlowRunner writes a checkpoint after every state transition:
```
PENDING → RUNNING → MOVED → COMPLETED
              ↘ ERROR
```
`RecoveryManager` checks for `RUNNING`/`PENDING` records on startup.

## IO retry

`MoverNode` wraps `safeMoveFile` with `withRetry()` (exponential backoff, 3 retries). Only **transient** errors (`EBUSY`, `ETIMEDOUT`, etc.) are retried; **fatal** errors (`EACCES`, `ENOSPC`) fail immediately.

## Quick verification

```bash
# 1. Type-check everything
npx tsc --noEmit && npx tsc -p tsconfig.electron.json --noEmit && cd web && npx tsc --noEmit

# 2. Build frontend
cd web && npm run build

# 3. Build Electron backend
npx tsc -p tsconfig.electron.json

# 4. Package (optional; skip if winCodeSign download fails)
npm run electron:build
```

## Env file

`.env` at project root controls CLI mode paths and concurrency. Electron/GUI mode ignores it because paths are set in the GUI itself.
