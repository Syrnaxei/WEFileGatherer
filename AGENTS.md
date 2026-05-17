# AGENTS.md — Video File Processing V1

## Frontend design system (Precision Terminal)

The web frontend uses a CSS-variable-driven design system. **All colors, spacing, radii, and shadows must be referenced via `var(--xxx)` — never hardcoded.** The full spec is at `docs/前端设计系统规范.md`.

Key rules for any UI change:

- **Colors**: use `var(--bg-surface-1)`, `var(--text-primary)`, `var(--accent)`, `var(--error)`, etc. No `#xxxxxx` or `isDark ? '#xxx' : '#yyy'`.
- **Buttons**: use `className="btn btn-primary"` / `btn-success` / `btn-danger` / `btn-ghost` / `btn-outline` instead of hand-written button styles.
- **Inputs**: use `className="input"` (or `input input-mono` for paths/code).
- **Typography**: UI text → `var(--font-ui)` (DM Sans), code/paths/logs → `var(--font-mono)` (JetBrains Mono). Both are imported locally via `@fontsource` in `main.tsx` — no CDN.
- **Dark/light**: themes switch via `data-theme` attribute on `<html>`. Components should NOT pass `isDark` for color decisions; CSS variables handle it automatically. Use `isDark` only for behavioral differences.
- **Spacing**: 4px grid. Page horizontal padding = 20px, card gaps = 16px, button gaps = 8px.
- **Header height**: 52px.
- **Sidebar width**: 60px.
- **Log panel width**: 420px.
- **Animations**: `transition: 150ms ease` for hover/color changes. Use `animate-fade-in-up` class for page enters.

### Reusable CSS classes (from `index.css`)
`.btn` / `.btn-primary` / `.btn-success` / `.btn-danger` / `.btn-ghost` / `.btn-outline` — buttons  
`.input` / `.input-mono` — text inputs  
`.card` / `.card-header` / `.card-body` — card containers  
`.badge` / `.badge-success` / `.badge-error` — status badges  
`.status-dot` / `.status-dot-active` / `.status-dot-inactive` — connection indicator  
`.tag-chip` — small label chips

### Component patterns (reference implementations)
| Pattern | Reference file |
|---------|---------------|
| Stat cards | `StatsDashboard.tsx` |
| Grid file rows | `FileList.tsx` |
| Terminal/log view | `LogTerminal.tsx` |
| Toast notifications | `Toast.tsx` |
| Sidebar navigation | `Sidebar.tsx` |
| Card-based forms | `SettingsPage.tsx` |
| Drag-to-reorder list | `TagManagement.tsx` |

---

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

## Thumbnail generation (ffmpeg-based)

`src/utils/thumbnail.ts` provides video thumbnail generation via ffmpeg:

- `computeVideoHash(filePath)` — SHA256 of file path truncated to 16 hex chars, used as cache directory name in `SVFPcache/`
- `generateThumbnailsForVideo(videoPath, fileId, count, options)` — extracts N frames at evenly-spaced timestamps, caches as JPEG. Cached thumbnails are reused on subsequent calls.
- `getFfmpegInfo()` / `detectFfmpegInDir()` / `clearFfmpegCache()` — ffmpeg binary detection with persistence
- `cleanupOldThumbnails()` is called on server startup — deletes all cached thumbnail directories

Thumbnail quality (low/medium/high) maps to JPEG quality values (12/6/3) and resolutions (480x270 / 640x360 / 960x540).

`src/api/thumbnail.ts` serves cached images at `GET /api/thumbnail-files/:videoHash/:filename` and provides ffmpeg status, detection, cache size, and cache clearing endpoints. `src/utils/probe.ts` uses ffprobe for duration/bitrate/fileSize.

## Processing modes

FlowRunner supports two modes, persisted via `tbl_settings` key `processingMode`:

- **parallel** (default) — uses `PromiseQueue` with configurable concurrency (1-5, default 5)
- **fifo** — processes files one at a time sequentially (concurrency forced to 1)

`resolveConcurrency()` in `src/api/flows.ts:56` reads these settings and enforces the 1-5 bound.

## Extended settings keys

Beyond the basics in README (sourceDir, theme, scrapeSourceDir, etc.), these settings control additional behavior:

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
| `thumbnailCount` | `3` | Number of thumbnails per video |
| `showFullPathOptions` | — | Master toggle for full path display |
| `workspaceShowFullPath` | — | Per-page full path toggle |
| `scrapeShowFullPath` | — | Per-page full path toggle |
| `fileListViewMode` | `list` | `list` or `thumbnail` |

## Legacy lowdb

`src/db.ts` uses `lowdb` (JSON file at `data/db.json`) for flow persistence. This predates the SQLite layer and is largely superseded by `src/db/sqlite.ts`. New code should use SQLite.

## Version management

Single source of truth: `src/version.ts` exports `APP_NAME`, `APP_SHORT_NAME`, `APP_VERSION`, `BUILD_DATE`, `GITHUB_URL`.

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
