# 搜刮（Scrape）技术文档

> 版本：1.1.5 | 最后更新：2026-05-09

## 1. 功能概述

搜刮是 SVFP 的批量文件收集与导出模块。用户配置搜刮源目录和导出目标目录后，系统递归扫描源目录中的视频文件，并将其统一移动到导出目录。

### 1.1 核心流程

```
设置搜刮目录 + 导出目录 + 深度 → 加载（递归扫描） → 启动 → 文件移动至导出目录
```

### 1.2 与工作台的区别

| 特性 | 搜刮 | 工作台 |
|------|------|--------|
| 文件来源 | 递归扫描（可配置深度 0-4） | 单一源目录（平铺扫描） |
| 分类方式 | 统一导出到单一目录 | 基于 Tag 分类到不同目录 |
| 节点链路 | 仅 MoverNode | TaggerNode → MoverNode |
| 前置条件 | 搜刮目录 + 导出目录 | 源目录 + Tag 配置 |
| Tag 功能 | 无 | 有（选择、自动填充） |
| 统计面板 | 总计 / 已处理 / 失败 | 待处理 / 已标记 / 总计 / 已处理 / 失败 |

---

## 2. 后端逻辑实现

### 2.1 架构层次

```
Express Router (src/api/flows.ts)
    ↓
FlowRunner (src/core/runner.ts)
    ↓
Node Pipeline: MoverNode（单节点）
    ↓
SQLite Checkpoint (src/db/sqlite.ts)
```

### 2.2 API 接口设计

#### 2.2.1 递归扫描 `POST /api/scrape/scan`

按指定深度递归扫描目录中的视频文件。

**请求体：**
```json
{
  "directory": "D:/videos",
  "depth": 2
}
```

**参数说明：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `directory` | string | 是 | 搜刮源目录绝对路径 |
| `depth` | number | 否 | 递归深度，默认 1，范围 0-4 |

**成功响应（200）：**
```json
{
  "success": true,
  "files": [
    {
      "id": "uuid-v4",
      "fileName": "video1.mp4",
      "filePath": "D:/videos/subdir/video1.mp4"
    }
  ]
}
```

**错误响应：**
| 状态码 | 说明 |
|--------|------|
| 400 | `directory` 参数缺失 |
| 500 | 目录读取失败 |

**递归扫描算法：**

```
scanRecursive(dir, maxDepth, currentDepth=0):
    if currentDepth > maxDepth: return []
    
    results = []
    for entry in readdir(dir):
        if entry is file and video extension:
            results.push(entry)
        if entry is directory and currentDepth < maxDepth:
            results.push(...scanRecursive(subdir, maxDepth, currentDepth+1))
    
    return results
```

- 深度 0：仅扫描根目录（不进入子文件夹）
- 深度 1：扫描根目录 + 一级子目录
- 深度 N：扫描根目录 + N 级子目录
- 单个目录读取失败不影响其他目录（静默跳过）

**支持的文件格式：** `.mp4` `.avi` `.mkv` `.mov` `.wmv` `.flv` `.webm`

#### 2.2.2 启动搜刮 `POST /api/scrape/start`

启动搜刮文件移动流程。固定使用 `scrape-flow` 作为 flowId。

**请求体：**
```json
{
  "files": [
    {
      "id": "uuid",
      "fileName": "video1.mp4",
      "filePath": "D:/videos/subdir/video1.mp4"
    }
  ],
  "exportDir": "D:/output/collected"
}
```

**成功响应（200）：**
```json
{
  "success": true,
  "message": "Started processing 5 files"
}
```

**错误响应：**
| 状态码 | 场景 |
|--------|------|
| 400 | `files` 为空或非数组 |
| 400 | `exportDir` 缺失 |

#### 2.2.3 停止搜刮 `POST /api/scrape/stop`

停止正在运行的搜刮流程。

**成功响应（200）：**
```json
{ "success": true, "message": "Scrape flow stopped" }
```

**错误响应：**
| 状态码 | 说明 |
|--------|------|
| 404 | 没有正在运行的搜刮流程 |

### 2.3 工作流构建

搜刮使用简化的单节点 Flow：

```typescript
const flow: IFlow = {
  id: 'scrape-flow',
  name: 'Scrape Processing',
  nodes: [
    NodeFactory.create({
      id: 'node-mover',
      type: 'mover',
      config: {
        targetPathTemplate: '{metadata.exportDir}/{filename}',
        overwrite: false,
      },
    }),
  ],
  edges: [],  // 无边，单节点直接执行
};
```

**节点链路：** `MoverNode`（仅移动节点，无 TaggerNode）

**关键差异：**
- 无 TaggerNode：不需要 Tag 分类
- 无边（edges 为空）：FlowRunner 检测到无边后直接结束
- 模板使用 `{metadata.exportDir}` 而非 `{metadata.targetPath}`

### 2.4 上下文注入

搜刮启动时为每个文件注入的 metadata：

```json
{
  "exportDir": "D:/output/collected",
  "detectedAt": "2026-05-09T..."
}
```

路径解析：`{metadata.exportDir}/{filename}` → `D:/output/collected/video1.mp4`

### 2.5 共享基础设施

搜刮复用工作台的核心组件：

| 组件 | 复用方式 |
|------|---------|
| FlowRunner | 直接实例化，传入 scrape-flow |
| MoverNode | 通过 NodeFactory 创建 |
| PromiseQueue | FlowRunner 内部使用 |
| withRetry | MoverNode 内部调用 |
| safeMoveFile | MoverNode 内部调用 |
| SQLiteDb | Checkpoint 写入 |
| Socket.io | 日志推送（room: `flow:scrape-flow`） |

---

## 3. 前后端交互逻辑

### 3.1 通信架构

```
React (web/src/App.tsx)
    │
    ├── HTTP REST (fetch)
    │   ├── POST /api/scrape/scan   → 递归扫描
    │   ├── POST /api/scrape/start  → 启动搜刮
    │   ├── POST /api/scrape/stop   → 停止搜刮
    │   └── GET/POST /api/settings/:key → 读写搜刮设置
    │
    └── WebSocket (Socket.io)
        └── room: flow:scrape-flow
            ├── subscribe → 加入房间
            └── log event → 接收实时日志
```

### 3.2 状态管理

搜刮状态集中在 [App.tsx](file:///e:/AAAProject/VideoFileProcessing/web/src/App.tsx) 管理，与工作台状态完全独立：

| 状态 | 类型 | 说明 |
|------|------|------|
| `scrapeFiles` | `ScrapeFileItem[]` | 搜刮文件列表 |
| `scrapeIsRunning` | `boolean` | 是否正在处理 |
| `scrapeSourceDir` | `string` | 搜刮源目录 |
| `scrapeExportDir` | `string` | 导出目标目录 |
| `scrapeDepth` | `number` | 递归深度 |
| `scrapeProcessedCount` | `number` | 已处理计数 |

**状态提升设计：** 搜刮文件列表状态提升至 App.tsx，确保用户在"搜刮"和"设置"页面间切换时文件列表不丢失。

### 3.3 设置同步机制

搜刮设置（源目录、导出目录、深度）通过 `tbl_settings` 表持久化：

| 设置 Key | 存储位置 | 读取时机 |
|----------|---------|---------|
| `scrapeSourceDir` | `tbl_settings` | 每次 `activePage` 变化时 |
| `scrapeExportDir` | `tbl_settings` | 每次 `activePage` 变化时 |
| `scrapeDepth` | `tbl_settings` | 每次 `activePage` 变化时 |

```typescript
// App.tsx — 页面切换时重新拉取设置
useEffect(() => {
  fetch(`${API_BASE}/settings/scrapeSourceDir`)...
  fetch(`${API_BASE}/settings/scrapeExportDir`)...
  fetch(`${API_BASE}/settings/scrapeDepth`)...
}, [activePage]);  // 关键：依赖 activePage，切回搜刮页时刷新
```

### 3.4 实时通信

搜刮使用独立的 Socket.io 房间 `flow:scrape-flow`：

```typescript
const scrapeSocket = useSocket('scrape-flow');
```

与工作台的 `useSocket('flow-batch')` 完全隔离，日志和状态互不干扰。

**前端状态更新逻辑：**
- `flow_complete` 事件 → `scrapeSocket.completedIds.add(traceId)`
- `error` 事件 → `scrapeSocket.failedIds.add(traceId)`
- `scrapeProcessedCount = scrapeSocket.completedCount`
- 当 `completedCount >= scrapeFiles.length` 时，自动将 `scrapeIsRunning` 设为 `false`

### 3.5 按钮交互规则

`foldersReady = scrapeSourceDir.trim() !== '' && scrapeExportDir.trim() !== ''`

| 状态 | 加载按钮 | 启动按钮 | 停止按钮 |
|------|---------|---------|---------|
| 目录未配置 | 禁用（灰） | 禁用（灰） | 禁用（灰） |
| 目录已配置 + 列表空 | 可用（紫） | 禁用（灰） | 禁用（灰） |
| 目录已配置 + 有文件 + 未运行 | 禁用（灰） | 可用（绿） | 禁用（灰） |
| 运行中 | 禁用（灰） | 禁用（灰） | 可用（红） |

禁用状态视觉反馈：背景色 `#6b7280`、光标 `not-allowed`、透明度 `0.6`。

### 3.6 ScrapePage 组件

[ScrapePage](file:///e:/AAAProject/VideoFileProcessing/web/src/components/ScrapePage.tsx) 是无状态展示组件，所有数据和回调通过 props 传入：

```typescript
interface ScrapePageProps {
  isDark: boolean;
  files: ScrapeFileItem[];
  isRunning: boolean;
  scrapeSourceDir: string;
  scrapeExportDir: string;
  scrapeDepth: number;
  processedCount: number;
  failedCount: number;
  logs: LogEntry[];
  connected: boolean;
  onLoad: () => void;
  onStart: () => void;
  onStop: () => void;
  onRemove: (index: number) => void;
}
```

**界面组成：**
1. **Header**：显示搜刮目录、导出目录、深度参数 + 加载/启动/停止按钮
2. **ScrapeStatsDashboard**：总计 / 已处理 / 失败 统计卡片
3. **文件列表**：表格形式，列：文件名、路径、状态、操作（删除）
4. **LogTerminal**：右侧实时日志终端

**与工作台 FileList 的区别：**
- 无 Tag 列（不需要 TagInput 组件）
- 无目标路径列
- 状态列直接显示"待处理/已完成/失败"
- 删除按钮仅在运行中禁用

---

## 4. 数据流转过程

### 4.1 完整时序

```
用户操作              前端                     后端                     数据库
  │                   │                       │                       │
  ├─ 设置页配置 ──────→│ SettingsPage           │                       │
  │  搜刮目录          │─ POST /settings/scrapeSourceDir ────────────→│ UPSERT
  │  导出目录          │─ POST /settings/scrapeExportDir ────────────→│ UPSERT
  │  搜刮深度          │─ POST /settings/scrapeDepth ────────────────→│ UPSERT
  │                   │                       │                       │
  ├─ 切换到搜刮页 ────→│ activePage='scrape'    │                       │
  │                   │─ GET /settings/scrape* ──────────────────────→│ SELECT
  │                   │←── 最新设置值 ─────────│                       │
  │                   │                       │                       │
  ├─ 点击加载 ────────→│ handleScrapeLoad()    │                       │
  │                   │─ POST /api/scrape/scan→│ scanRecursive()      │
  │                   │                       │  深度递归扫描          │
  │                   │←── files[] ───────────│ 生成 UUID             │
  │                   │ setScrapeFiles()       │                       │
  │                   │                       │                       │
  ├─ 点击启动 ────────→│ handleScrapeStart()   │                       │
  │                   │─ POST /api/scrape/start│ 构建 Flow             │
  │                   │                       │─ new FlowRunner()     │
  │                   │                       │─ runner.enqueue()     │→ INSERT (PENDING)
  │                   │←── {success:true} ────│                       │
  │                   │ subscribe('scrape-flow')                      │
  │                   │                       │                       │
  │                   │                       │─ MoverNode.handle()   │→ UPDATE (RUNNING)
  │                   │                       │  resolveTemplate(     │
  │                   │                       │    '{metadata.exportDir}/{filename}'│
  │                   │                       │  )                    │
  │                   │                       │  safeMoveFile()       │
  │                   │                       │  withRetry()          │
  │                   │  ←── log: node_start ─│                       │
  │                   │  ←── log: node_complete│                      │→ UPDATE (MOVED)
  │                   │                       │                       │→ UPDATE (COMPLETED)
  │                   │  ←── log: flow_complete│                      │
  │                   │ completedIds.add(id)   │                       │
  │                   │                       │                       │
  │                   │ completedCount >= N    │                       │
  │                   │ setIsRunning(false)    │                       │
```

### 4.2 文件移动路径解析

```
用户配置:
  scrapeSourceDir = "D:/videos"
  scrapeExportDir = "D:/output/collected"
  scrapeDepth = 2
    ↓
扫描结果: D:/videos/subdir/video1.mp4
    ↓
构建 metadata: { exportDir: "D:/output/collected" }
    ↓
MoverNode: resolveTemplate("{metadata.exportDir}/{filename}", ctx)
    ↓
目标路径: "D:/output/collected/video1.mp4"
    ↓
safeMoveFile("D:/videos/subdir/video1.mp4", "D:/output/collected/video1.mp4")
```

**注意：** 搜刮不保留原始目录结构，所有文件平铺到导出目录。若存在同名文件且 `overwrite: false`，移动将失败。

---

## 5. 关键业务规则

### 5.1 前置条件校验

1. 搜刮目录和导出目录均不能为空字符串
2. 两个目录未配置时，加载和启动按钮均禁用
3. 仅导出目录未配置时，加载可用但启动禁用
4. 前端（按钮 disabled）和后端（API 返回 400）各执行一次校验

### 5.2 递归深度限制

- 最小值：0（仅根目录）
- 最大值：4（最多 4 级子目录）
- 默认值：1
- 前端 `SettingsPage` 和后端 `scanRecursive` 均有校验

### 5.3 同名文件处理

- `overwrite` 固定为 `false`
- 若导出目录已存在同名文件，`safeMoveFile` 的 `fs.rename` 将失败
- 错误被 `withRetry` 捕获，若为致命错误（非 EBUSY 等）则直接失败

### 5.4 状态隔离

- 搜刮使用独立的 `useSocket('scrape-flow')` 实例
- Socket.io 房间 `flow:scrape-flow` 与工作台的 `flow:flow-batch` 完全隔离
- 前端状态变量均以 `scrape` 前缀命名，与工作台状态无交集

### 5.5 页面切换状态保持

- 文件列表状态提升至 App.tsx（`scrapeFiles`）
- 设置通过 `activePage` 依赖的 useEffect 在切回时刷新
- 用户在"搜刮"和"设置"间切换不会丢失已加载的文件列表

---

## 6. 技术选型依据

搜刮在工作台基础上新增的技术决策：

| 决策 | 原因 |
|------|------|
| 复用 FlowRunner | 避免重复实现状态机、Checkpoint、并发控制 |
| 单节点 Flow（无边） | 搜刮无需 Tag 分类，MoverNode 直接执行后结束 |
| 独立 Socket.io 房间 | 日志隔离，避免工作台和搜刮日志互相污染 |
| 状态提升至 App.tsx | 解决页面切换导致组件卸载丢失文件列表的问题 |
| `activePage` 依赖刷新设置 | 解决设置页修改后搜刮页不更新的问题 |
| 独立 ScrapeStatsDashboard | 搜刮无 Tag 概念，不需要"待处理/已标记"卡片 |
| ScrapePage 无状态组件 | 所有状态由 App.tsx 管理，ScrapePage 仅负责渲染 |

---

## 7. 相关文件索引

| 文件 | 职责 |
|------|------|
| [src/api/flows.ts](file:///e:/AAAProject/VideoFileProcessing/src/api/flows.ts) | `/scrape/scan` `/scrape/start` `/scrape/stop` 路由 |
| [src/api/settings.ts](file:///e:/AAAProject/VideoFileProcessing/src/api/settings.ts) | 搜刮设置读写 API |
| [src/core/runner.ts](file:///e:/AAAProject/VideoFileProcessing/src/core/runner.ts) | FlowRunner 执行引擎（复用） |
| [src/nodes/mover.ts](file:///e:/AAAProject/VideoFileProcessing/src/nodes/mover.ts) | MoverNode（复用） |
| [src/factory/node-factory.ts](file:///e:/AAAProject/VideoFileProcessing/src/factory/node-factory.ts) | NodeFactory（复用） |
| [src/utils/io.ts](file:///e:/AAAProject/VideoFileProcessing/src/utils/io.ts) | safeMoveFile + resolveTemplate（复用） |
| [src/utils/retry.ts](file:///e:/AAAProject/VideoFileProcessing/src/utils/retry.ts) | withRetry（复用） |
| [src/db/sqlite.ts](file:///e:/AAAProject/VideoFileProcessing/src/db/sqlite.ts) | SQLite + tbl_settings（复用） |
| [src/server.ts](file:///e:/AAAProject/VideoFileProcessing/src/server.ts) | Express + Socket.io（复用） |
| [web/src/App.tsx](file:///e:/AAAProject/VideoFileProcessing/web/src/App.tsx) | 搜刮状态管理 + 事件处理 |
| [web/src/components/ScrapePage.tsx](file:///e:/AAAProject/VideoFileProcessing/web/src/components/ScrapePage.tsx) | 搜刮页面 UI |
| [web/src/components/ScrapeStatsDashboard.tsx](file:///e:/AAAProject/VideoFileProcessing/web/src/components/ScrapeStatsDashboard.tsx) | 搜刮统计面板 |
| [web/src/components/SettingsPage.tsx](file:///e:/AAAProject/VideoFileProcessing/web/src/components/SettingsPage.tsx) | 搜刮设置 UI |
| [web/src/components/Sidebar.tsx](file:///e:/AAAProject/VideoFileProcessing/web/src/components/Sidebar.tsx) | 侧边栏导航（含搜刮入口） |
| [web/src/hooks/useSocket.ts](file:///e:/AAAProject/VideoFileProcessing/web/src/hooks/useSocket.ts) | Socket.io Hook（复用） |