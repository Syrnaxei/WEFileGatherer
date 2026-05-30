# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

SVFP (Syrnaxies Video File Processor) — a batch-mode video file processing system built on a workflow engine. V1 handles file path moves + metadata tagging only; no video codec work. It uses a table-based batch UI, not a drag-and-drop node editor.

**Tech stack:** Vite 8 + React 19 + TypeScript 6 (frontend), Express 5 + Socket.io + better-sqlite3 (backend), Electron 35 (desktop wrapper).

## Commands

```bash
# Type-check (all three — different tsconfig include sets)
npx tsc --noEmit                                    # plain backend
npx tsc -p tsconfig.electron.json --noEmit           # Electron main process
cd web && npx tsc --noEmit                           # frontend

# Dev (Electron with HMR — tsc watch + Vite dev + Electron)
npm run electron:dev

# Frontend dev server only (no Electron)
cd web && npm run dev

# Build Electron backend only (no packaging)
npm run build:electron                               # tsc -p tsconfig.electron.json

# Production build (full: tsc + vite build + electron-builder)
npm run electron:build

# Web lint
cd web && npm run lint

# Quick verification (run after any backend/frontend changes)
npx tsc --noEmit && npx tsc -p tsconfig.electron.json --noEmit && cd web && npx tsc --noEmit && npm run build
```

## Three entry points

- `src/electron/main.ts` — **primary**: Electron wrapper, embeds Express server in-process
- `src/server.ts` — standalone Express 5 + Socket.io, serves `web/dist/`
- `src/main.ts` — CLI mode (deprecated, still compiles but uses old lowdb path)

## Key architecture

### Batch workflow (primary mode)
1. User sets source directory → clicks "Load" (`POST /api/scan`) → files listed in table
2. User assigns a tag per file (tags must exist in Tag Management, each has a `target_path`)
3. "Start" sends files to `POST /api/flows/flow-batch/start`
4. API builds flow: `TaggerNode` (UserTag rule) → `MoverNode` (resolves `{metadata.targetPath}/{filename}`)

### Scrape mode
Recursive directory scrape + unified export. Single `MoverNode`, no tagging. Flow ID hardcoded as `'scrape-flow'`.

### Processing modes

FlowRunner supports two modes, persisted in `tbl_settings` key `processingMode`:

- **parallel** (default) — `PromiseQueue` with configurable concurrency (1–5, default 5)
- **fifo** — sequential, one file at a time (concurrency forced to 1)

`resolveConcurrency()` in `src/api/flows.ts` reads these settings at flow start.

### State machine
`PENDING → RUNNING → MOVED → COMPLETED` (or `→ ERROR → DISCARDED`). FlowRunner writes SQLite checkpoints at every transition. `RecoveryManager` checks for `RUNNING` records on startup.

### Patterns
- **NodeFactory** (`src/factory/node-factory.ts`): must be used to instantiate node classes from JSON. Plain JSON won't work — the runner calls `.handle()`.
- **PromiseQueue** (`src/utils/queue.ts`): hand-written concurrency limiter (default 5, configurable 1–5).
- **withRetry** (`src/utils/retry.ts`): exponential backoff (3 retries, 1s base), only transient errors (EBUSY, EAGAIN, ETIMEDOUT). Fatal errors (EACCES, ENOSPC) fail immediately.
- **Path templates** (`src/utils/io.ts`): `{filename}`, `{ext}`, `{tag}`, `{tag[0]}`, `{metadata.xxx}`, `{YYYY}`, `{MM}`, `{DD}`.
- **Version** (`src/version.ts`): single source of truth — `APP_NAME`, `APP_SHORT_NAME`, `APP_VERSION`, `BUILD_DATE`, `GITHUB_URL`.

### Thumbnail generation (ffmpeg-based)

`src/utils/thumbnail.ts` — extracts N frames at evenly-spaced timestamps, caches as JPEG under `SVFPcache/{videoHash}/`. SHA256 hash of file path used as cache key. Cached thumbnails reused on subsequent calls. `cleanupOldThumbnails()` runs on server startup.

Quality levels (`thumbnailQuality` setting): low/medium/high → JPEG quality 12/6/3, resolution 480×270 / 640×360 / 960×540.

Served at `GET /api/thumbnail-files/:videoHash/:filename` via `src/api/thumbnail.ts`. Frontend: `ThumbnailImg` (lazy-load with retry) + `ThumbnailLightbox` (full-screen zoom 1×–3×, keyboard nav).

### API routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/scan` | Scan workspace source directory |
| POST | `/api/flows/:id/start` / `stop` | Start/stop batch flow |
| POST | `/api/scrape/scan` | Recursive scrape scan |
| POST | `/api/scrape/start` / `stop` | Start/stop scrape flow |
| GET/POST/PUT/DELETE | `/api/tags[/:id]` | Tag CRUD |
| PUT | `/api/tags/reorder` | Drag-to-reorder tags |
| GET/POST | `/api/settings/:key` | Settings read/write |
| GET | `/api/version` | App version info |
| GET | `/api/thumbnail-files/...` | Serve cached thumbnails |

### Real-time communication

Socket.io rooms isolate log streams between modes:

- `flow:flow-batch` — workspace/batch logs
- `flow:scrape-flow` — scrape logs

Events: `enqueue`, `node_start`, `node_complete`, `flow_complete`, `error`.

### Settings persistence

All settings stored in SQLite `tbl_settings` (key-value table), read/written via `GET/POST /api/settings/:key`. The `.env` file is **CLI-mode only** — Electron/GUI mode ignores it entirely. Key keys: `sourceDir`, `theme`, `scrapeSourceDir`, `scrapeExportDir`, `scrapeDepth`, `processingMode`, `concurrency`, `autoFillTagName`, `debugLog`, `thumbnailQuality`, `thumbnailCount`, `fileListViewMode`.

## Design system (frontend)

CSS-variable-driven "Precision Terminal" style based on Material Design 3 with Windows 10 UWP blue accent (#4CC2FF). **All colors/spacing/radii must use `var(--xxx)` — never hardcode.**

- **Colors**: `var(--bg-surface-1)`, `var(--text-primary)`, `var(--accent)`, `var(--error)`, etc. Themes switch via `data-theme` on `<html>`.
- **Buttons**: `className="btn btn-primary"` / `btn-success` / `btn-danger` / `btn-ghost` / `btn-outline`
- **Inputs**: `className="input"` or `input input-mono` (for paths/code)
- **Fonts**: UI → `var(--font-ui)` (DM Sans), code/paths/logs → `var(--font-mono)` (JetBrains Mono). Both imported locally via `@fontsource` in `main.tsx`.
- **Spacing**: 4px grid. Page h-padding 20px, card gaps 16px, button gaps 8px.
- **Header**: 52px. Sidebar: 180px expanded / 60px collapsed. Log panel: 420px.
- **Animations**: 150ms ease for hover/color; `animate-fade-in-up` for page enters.
- **Settings component classes**: `.settings-tile`, `.settings-expandable-tile`, `.settings-section-title`, `.settings-sub-item`, `.settings-sub-item-divider` — use these for any new settings-style pages.

Full spec at `docs/前端设计系统规范.md`. Component reference implementations listed in `AGENTS.md`.

## Gotchas

- **Express 5**: catch-all routes use `/{*splat}` syntax, not Express 4 `*`.
- **Electron output path**: `tsconfig.electron.json` uses `rootDir: ./src`, so compiled entry is `dist/electron/electron/main.js` (nested). Production `loadFile` uses `path.join(__dirname, '../../../web/dist/index.html')`.
- **Vite base**: must stay `base: './'` in `web/vite.config.ts` — absolute paths break Electron `file://` loading.
- **Electron input focus**: BrowserWindow must use `show: false` initially, show in `ready-to-show`, then call `mainWindow.focus()` + `mainWindow.webContents.focus()`.
- **better-sqlite3**: native C++ addon, rebuilt by `@electron/rebuild` during packaging. DB path: `data/vfp.db` (standalone) or `app.getPath('userData')/vfp.db` (Electron). WAL mode + foreign keys enabled.
- **Legacy lowdb** (`src/db.ts`): still exists for flow persistence but superseded by SQLite. New code should use `src/db/sqlite.ts`.
- **Old React Flow components**: `FlowCanvas`, `NodePanel`, `PropertyPanel` exist in `web/src/components/` but are not imported by `App.tsx`.
- **No tests**: no test framework, no CI.
- **Chinese comments required**: all code comments must be in Chinese (per AGENTS.md).
