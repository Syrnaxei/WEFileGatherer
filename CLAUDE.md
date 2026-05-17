# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `AGENTS.md` for design system details and `README.md` for full architecture documentation.

## Build & type-check commands

```bash
# Type-check ALL TypeScript (run all three — different include sets)
npx tsc --noEmit                          # plain Node.js backend (excludes electron/)
npx tsc -p tsconfig.electron.json --noEmit  # Electron main process (different include list)
cd web && npx tsc --noEmit                # React frontend (project references, TS 6)

# Frontend lint
cd web && npm run lint                    # ESLint

# Build
cd web && npm run build                   # Vite frontend build (tsc -b + vite build)
npm run build:electron                    # tsc -p tsconfig.electron.json

# Development (Electron with hot reload — concurrent tsc watch + Vite dev + Electron)
npm run electron:dev

# CLI mode (deprecated, uses plain tsconfig, reads .env)
npm run dev                               # tsc && node dist/main.js

# Frontend standalone dev server (for UI work without Electron)
cd web && npm run dev

# Package for distribution (may fail at winCodeSign on non-admin Windows; exe still usable)
npm run electron:build
```

## Three entrypoints

- `src/main.ts` — **CLI mode** (deprecated). Uses `.env` for config, watches a directory. Compiles with `tsconfig.json`.
- `src/server.ts` — **Standalone HTTP server**. Express 5 + Socket.io, serves `web/dist/`. Compiles with both tsconfigs.
- `src/electron/main.ts` — **Electron wrapper**. Embeds the Express server in-process. Compiles with `tsconfig.electron.json`.

The Electron config uses `rootDir: ./src` + `outDir: ./dist/electron`, so the compiled entry is at `dist/electron/electron/main.js` (nested), NOT `dist/electron/main.js`. Both `package.json` `"main"` and `loadFile` paths account for this nesting.

## Express 5 — catch-all route syntax

Uses Express 5 (`@types/express` v5). The catch-all in `src/server.ts` uses `/{*splat}`. Express 4 `*` will not work.

## Dual TypeScript configs

- `tsconfig.json` — `rootDir: ./src`, `outDir: ./dist`, **excludes** `src/electron/**/*`. For CLI mode and standalone server.
- `tsconfig.electron.json` — `rootDir: ./src`, `outDir: ./dist/electron`, explicitly **includes** only `src/electron/`, `src/api/`, `src/core/`, `src/db/`, `src/factory/`, `src/nodes/`, `src/utils/`, `src/server.ts`. Does NOT include `src/main.ts`.

The web frontend uses its own TS config chain: `web/tsconfig.json` references `tsconfig.app.json` + `tsconfig.node.json`. Running `cd web && npx tsc --noEmit` uses both automatically.

## Frontend build must use relative paths

`web/vite.config.ts` must keep `base: './'`. Without it, built HTML uses absolute `/assets/...` paths which resolve to `file:///assets/...` inside Electron → blank white screen.

## Electron window focus

For `<input>` fields to work in the packaged app:
- `BrowserWindow` uses `show: false` initially
- Show only in `ready-to-show`, then call `mainWindow.focus()` and `mainWindow.webContents.focus()`

## Architecture: batch workflow, not drag-and-drop editor

This is NOT a node-graph editor. The current UI is a batch-processing table:

1. User sets a source directory → clicks "Load" → `POST /api/scan` lists video files
2. User assigns a Tag (must exist in Tag Management) to each file
3. "Start" → `POST /api/flows/flow-batch/start`
4. Backend builds a flow: `TaggerNode` (UserTag rule) → `MoverNode` (template: `{metadata.targetPath}/{filename}`)

Old React Flow canvas components (`FlowCanvas`, `NodePanel`, `PropertyPanel`) exist in `web/src/components/` but are **not imported** by `App.tsx`.

### Scrape mode

A second batch-processing page (`ScrapePage`) for recursive directory scraping:
- `POST /api/scrape/scan` — recursively scan a directory to a given depth
- `POST /api/scrape/start` — starts a `scrape-flow` with only `MoverNode`, resolving `{metadata.exportDir}/{filename}`
- Flow ID hardcoded as `'scrape-flow'`

## NodeFactory is required

When the API receives flow JSON from a request, it must use `NodeFactory.create()` (`src/factory/node-factory.ts`) to instantiate real class instances. Plain JSON won't work — the flow runner calls `.handle()` on each node.

## Path template syntax

`resolveTemplate()` in `src/utils/io.ts`: `{filename}`, `{originalFilename}`, `{ext}`, `{tag}`, `{tag[n]}`, `{metadata.xxx}`, `{YYYY}`, `{MM}`, `{DD}`.

## Frontend design system (Precision Terminal)

CSS-variable-driven. **All colors, spacing, radii, shadows via `var(--xxx)` — never hardcoded.** Full spec at `doc/前端设计系统规范.md`.

- Colors: `var(--bg-surface-1)`, `var(--text-primary)`, `var(--accent)`, `var(--error)`, etc.
- Buttons: `className="btn btn-primary"` / `btn-success` / `btn-danger` / `btn-ghost` / `btn-outline`
- Inputs: `className="input"` / `input-mono` (paths/code)
- Typography: UI → `var(--font-ui)` (DM Sans), code → `var(--font-mono)` (JetBrains Mono). Imported via `@fontsource` in `main.tsx`.
- Themes: `data-theme` attribute on `<html>`. Components must NOT pass `isDark` for color decisions; CSS variables handle that. Use `isDark` only for behavioral differences.
- Spacing: 4px grid. Page h-padding 20px, card gaps 16px, button gaps 8px.
- Layout: Header 52px, Sidebar 60px, Log panel 420px.
- Animations: `transition: 150ms ease`. Page enters use `animate-fade-in-up`.

## SQLite persistence

- `better-sqlite3` (native C++ addon, rebuilt by `@electron/rebuild` during packaging)
- DB path: `data/vfp.db` (standalone) or `app.getPath('userData')/vfp.db` (Electron)
- WAL mode + foreign keys enabled
- Key tables: `tbl_flows`, `tbl_context_history`, `tbl_tags`, `tbl_settings`
- Settings (source dir, theme, scrape paths, etc.) persisted in `tbl_settings` via `POST /api/settings/:key`

## State machine & recovery

```
PENDING → RUNNING → MOVED → COMPLETED
              ↘ ERROR
```

FlowRunner writes checkpoints at every state transition. `RecoveryManager` checks for `RUNNING`/`PENDING` records on startup — `RUNNING` generates warnings, `PENDING` can be re-enqueued.

## IO retry

`MoverNode` wraps `safeMoveFile` with `withRetry()`: 3 retries, exponential backoff (base 1000ms, multiplier 2). Only transient errors (`EBUSY`, `EAGAIN`, `ETIMEDOUT`, etc.) are retried; fatal errors (`EACCES`, `ENOSPC`, `EPERM`) fail immediately. `safeMoveFile` handles cross-device moves (`EXDEV`) by falling back to copy+unlink.

## Settings and env

- `.env` at project root → CLI mode only (`src/main.ts`). Controls paths, file pattern, concurrency.
- Electron/GUI mode ignores `.env` — settings stored in SQLite `tbl_settings`, managed via REST API.

## No tests

There is no test framework, test files, or CI configuration in this repository.

## Socket.io rooms

- `flow:flow-batch` — workspace log events
- `flow:scrape-flow` — scrape log events

Events: `enqueue`, `node_start`, `node_complete`, `flow_complete`, `error`.

## Thumbnail generation (ffmpeg-based)

`src/utils/thumbnail.ts` provides video thumbnail generation via ffmpeg. Key functions:

- `computeVideoHash(filePath)` — SHA256 of file path truncated to 16 hex chars, used as cache directory name
- `generateThumbnailsForVideo(videoPath, fileId, count, options)` — extracts N frames at evenly-spaced timestamps, caches as JPEG in `<temp>/SVFPcache/<hash>/<i>.jpg`. Cached thumbnails are reused on subsequent calls.
- `getFfmpegInfo()` / `detectFfmpegInDir()` / `clearFfmpegCache()` — ffmpeg binary detection with persistence

Thumbnail quality (low/medium/high) maps to JPEG quality values (12/6/3) and resolutions (480×270 / 640×360 / 960×540).

`cleanupOldThumbnails()` is called on server startup and deletes all cached thumbnail directories.

The thumbnail API router (`src/api/thumbnail.ts`) serves cached images at `GET /api/thumbnail-files/:videoHash/:filename` and provides ffmpeg status, detection, cache size, and cache clearing endpoints.

## Processing modes

The FlowRunner supports two modes, persisted via `tbl_settings` key `processingMode`:

- **parallel** (default) — uses `PromiseQueue` with configurable concurrency (1-5, default 5)
- **fifo** — processes files one at a time sequentially

## New settings keys (beyond those in README)

| Key | Default | Description |
|-----|---------|-------------|
| `debugLog` | `false` | Show full processing logs vs. start/complete only |
| `processingMode` | `parallel` | `parallel` or `fifo` |
| `concurrency` | `5` | Max parallel files (1-5) |
| `toastDuration` | `5` | Toast notification duration in seconds (0-30) |
| `ffmpegBinPath` | — | User-configured ffmpeg directory path |
| `ffmpegAvailable` | — | Persisted ffmpeg detection result |
| `ffmpegVersion` | — | Persisted ffmpeg version string |
| `ffmpegPath` | — | Persisted ffmpeg resolved path |
| `thumbnailQuality` | `medium` | `low` / `medium` / `high` |
| `showFullPathOptions` | — | Master toggle for full path display |
| `workspaceShowFullPath` | — | Per-page full path toggle |
| `scrapeShowFullPath` | — | Per-page full path toggle |
| `fileListViewMode` | `list` | `list` or `thumbnail` (beta) |

## New reusable frontend components

- `InputNumber.tsx` — numeric stepper with +/- buttons, min/max/step/unit props, uses all CSS variables
- `SelectDropdown.tsx` — styled select dropdown replacement
- `ThumbnailLightbox.tsx` — fullscreen image viewer with zoom, keyboard navigation, and thumbnail strip
- `ThumbnailImg.tsx` — lazy-loaded thumbnail image with loading/error states

## Legacy lowdb

`src/db.ts` uses `lowdb` (JSON file at `data/db.json`) for flow persistence. This predates the SQLite layer and is largely superseded by `src/db/sqlite.ts`. New code should use SQLite.

## Version management

Single source of truth: `src/version.ts` exports `APP_NAME`, `APP_SHORT_NAME`, `APP_VERSION`, `BUILD_DATE`, `GITHUB_URL`.
