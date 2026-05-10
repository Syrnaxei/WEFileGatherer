# AGENTS.md — Video File Processing V1

## Three entrypoints

- `src/main.ts` — CLI mode (uses `.env`, watches a directory, deprecated in favor of the batch workflow but still compiles)
- `src/server.ts` — standalone HTTP server (Express 5 + Socket.io, serves `web/dist/`)
- `src/electron/main.ts` — Electron wrapper (embeds the Express server in-process)

The Electron config (`tsconfig.electron.json`) includes `src/server.ts` and shared modules but **not** `src/main.ts`.

## Express 5

This project uses Express 5 (`@types/express` v5). The catch-all route in `src/server.ts` uses `/{*splat}` syntax. Express 4 `*` catch-all will not work.

## Dual TypeScript build configs

- `tsconfig.json` — plain Node.js backend (`outDir: ./dist`, excludes `src/electron/`)
- `tsconfig.electron.json` — Electron main process (`outDir: ./dist/electron`, includes `src/electron/`, `src/api/`, `src/core/`, `src/db/`, `src/factory/`, `src/nodes/`, `src/utils/`, `src/server.ts`)
- The Electron config uses `rootDir: ./src`, so the compiled entry ends up at `dist/electron/electron/main.js` (nested), **not** `dist/electron/main.js`. This has caused both `package.json` `"main"` and the `loadFile` path bugs before. The production `loadFile` uses `path.join(__dirname, '../../../web/dist/index.html')` because of this nesting.
- Web frontend uses project references: `web/tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`. `cd web && npx tsc --noEmit` uses both automatically.

## Frontend build must be relative-path

`web/vite.config.ts` must keep `base: './'`. Without it, the built HTML uses absolute `/assets/...` paths which resolve to `file:///assets/...` inside Electron and show a blank white screen.

## Batch workflow mode

This is **not** a drag-and-drop node editor. The current UI is a batch-processing table:

1. User configures a source directory (default `./wfp`).
2. GUI "Load" button calls `POST /api/scan` to list video files.
3. User enters a **tag** name per file (each tag must exist in the Tag Management page with a configured `target_path`).
4. "Start" sends the file list to `POST /api/flows/flow-batch/start`.
5. The API builds a flow: `TaggerNode` (with `UserTag` rule) reads `ctx.metadata.userTag`, then `MoverNode` resolves `{metadata.targetPath}/{filename}` from the template.

The old React Flow canvas components (`FlowCanvas`, `NodePanel`, `PropertyPanel`) exist in `web/src/components/` but are **not imported** by `App.tsx`.

## Scrape mode

A second batch-processing page (`ScrapePage`) for recursive directory scraping and moving:

- `POST /api/scrape/scan` — recursively scan a directory to a given depth for video files
- `POST /api/scrape/start` — starts a `scrape-flow` with only a `MoverNode`, resolving `{metadata.exportDir}/{filename}`
- `POST /api/scrape/stop` — stops the running scrape flow
- Sets `ctx.metadata.exportDir` on each file context; no `TaggerNode` involved
- The flow ID is hardcoded as `'scrape-flow'`

## Path template syntax

`resolveTemplate()` in `src/utils/io.ts` supports these placeholders:

- `{filename}`, `{originalFilename}`, `{ext}`, `{tag}`, `{tag[0]}`, `{tag[1]}`
- `{metadata.xxx}` — access any metadata field (most common: `{metadata.targetPath}`)
- `{YYYY}`, `{MM}`, `{DD}` — date placeholders

## NodeFactory is required

When the API receives a flow from a request, it must use `NodeFactory.create()` (`src/factory/node-factory.ts`) to instantiate real `WatcherNode`/`TaggerNode`/`MoverNode` class instances. Plain JSON won't work — the flow runner calls `.handle()` on each node.

## Key commands

```bash
# Type-check ONLY (run both — they have different include sets)
npx tsc --noEmit                    # plain backend
npx tsc -p tsconfig.electron.json --noEmit   # Electron main process

# Web frontend type-check and lint
cd web && npx tsc --noEmit
cd web && npm run lint              # ESLint

# Development (Electron with hot reload — runs tsc watch + Vite dev + Electron)
npm run electron:dev

# Standalone CLI mode (deprecated; uses plain tsconfig, excludes Electron)
npm run dev                         # tsc && node dist/main.js

# Frontend dev server (standalone, for UI work without Electron)
cd web && npm run dev

# Production build (may fail at winCodeSign on non-admin Windows; the exe is usable)
npm run electron:build
```

## Native module: better-sqlite3

- `better-sqlite3` is a native C++ addon. `electron-builder` runs `@electron/rebuild` during packaging.
- DB path: `data/vfp.db` (standalone) or `app.getPath('userData')/vfp.db` (Electron).
- WAL mode enabled (`journal_mode = WAL`), foreign keys enabled.

## Electron window focus gotcha

To make `<input>` fields focusable in the packaged app:

- `BrowserWindow` must use `show: false` initially.
- Show only in `ready-to-show`, then call `mainWindow.focus()` and `mainWindow.webContents.focus()`.
- The default Vite template CSS sets `#root { width: 1126px; text-align: center; }` which breaks Electron layout; `web/src/index.css` has a minimal reset instead.

## SQLite state machine

FlowRunner writes a checkpoint after every state transition:

```
PENDING → RUNNING → MOVED → COMPLETED
              ↘ ERROR
```

`RecoveryManager` checks for `RUNNING`/`PENDING` records on startup. `RUNNING` records signal a mid-process crash and generate warnings; `PENDING` records can be re-enqueued.

## IO retry

`MoverNode` wraps `safeMoveFile` with `withRetry()` (exponential backoff, 3 retries, base 1000ms). Only **transient** errors (`EBUSY`, `EAGAIN`, `ETIMEDOUT`, etc.) are retried; **fatal** errors (`EACCES`, `ENOSPC`, `EPERM`) fail immediately. `safeMoveFile` handles cross-device moves (EXDEV) by falling back to copy+unlink.

## Settings and env

- `.env` at project root controls CLI mode (`src/main.ts`) paths and concurrency.
- Electron/GUI mode ignores `.env` — settings (like source directory) are persisted in SQLite's `tbl_settings` table and set via `POST /api/settings/:key`.

## No tests

There is no test framework, no test files, and no CI configuration in this repo.

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
