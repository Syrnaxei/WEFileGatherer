# SVFP — 视频文件流处理系统 V1

## 项目概述

**SVFP**（Syrnaxies Video File Processor）是一个基于工作流引擎的视频文件批处理系统。V1 版本的核心功能是"**文件路径移动与元数据打标**"，不涉及任何视频编解码操作。

系统将视频文件视为在管道中流动的数据包，经过各节点处理后，最终移动到目标位置。当前版本采用**批处理表格界面**，提供两大功能模块：**工作台**（基于 Tag 的分类归档）和**搜刮**（递归扫描 + 统一导出）。

### 核心特性

- **工作台（批处理工作流）**：表格形式管理视频文件，按 Tag 自动归档到不同目标路径
- **搜刮（批量收集导出）**：递归扫描目录树，将所有视频文件统一移动到导出目录
- **Tag 管理系统**：支持创建/编辑/删除/拖拽排序 Tag，每个 Tag 绑定独立的目标路径
- **Tag 名称自动填充**：选择目标路径后自动以文件夹名填充 Tag 名称（可配置开关）
- **智能打标系统**：支持 UUID、正则提取、固定前缀、用户指定等多种 Tag 生成规则
- **安全文件移动**：支持跨磁盘分区移动，自动降级为 copy+unlink
- **并发队列控制**：限制同时处理的文件数量，防止 IO 风暴
- **SQLite 状态持久化**：Checkpoint 机制防止崩溃导致文件丢失
- **指数退避重试**：对瞬时 IO 错误自动重试（3 次，指数退避）
- **实时日志推送**：WebSocket 实时展示文件流转状态，工作台与搜刮日志隔离
- **桌面端封装**：Electron 封装为独立应用，支持本地文件夹选择对话框
- **夜间模式**：支持亮色/暗色主题切换，偏好自动持久化
- **统一版本控制**：通过 `version.ts` 集中管理应用版本号

---

## 系统架构

### 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Vite + React 19 + TypeScript |
| 实时通信 | Socket.io Client |
| 后端服务 | Express + Socket.io |
| 数据库 | better-sqlite3（WAL 模式，事务级持久化）|
| 文件监听 | chokidar |
| 桌面端 | Electron |
| 构建工具 | TypeScript + electron-builder |

### 架构演进

项目分四个阶段实现：

```
Phase 1: 核心数据模型定义
├── IFileContext（文件流转上下文）
├── INode<TConfig>（泛型节点接口）
├── IFlow + IEdge（工作流与连接）
└── ITagStrategy（Tag 策略预留）

Phase 2: 核心引擎实现
├── FlowRunner（并发队列调度器）
├── WatcherNode（chokidar + awaitWriteFinish）
├── TaggerNode（UUID/Regex/FixedPrefix/UserTag）
├── MoverNode（safeMoveFile + 模板解析）
└── PromiseQueue（手写并发控制队列）

Phase 3: Web GUI 批处理界面
├── 工作台（文件列表表格、Tag 分配、移除）
├── 搜刮（递归扫描、统一导出）
├── 侧边栏导航（工作台 / 搜刮 / Tag 管理 / 设置）
├── 统计仪表盘（工作台 5 卡片 / 搜刮 3 卡片，独立维护）
├── 实时日志终端（WebSocket 推送，房间隔离）
├── REST API（Express）
└── 前后端数据映射转换器

Phase 4: 生产级加固与桌面端
├── SQLite Checkpoint 状态机（PENDING/RUNNING/MOVED/COMPLETED/ERROR）
├── withRetry 装饰器（指数退避 + 错误分类）
├── RecoveryManager（崩溃恢复）
├── Electron 主进程封装
├── IPC 本地文件对话框
├── 统计仪表盘 + 错误队列管理
├── 全局主题系统（亮色/暗色模式）
├── 设置持久化（SQLite tbl_settings）
├── Tag 拖拽排序（sort_order + 平滑动画）
├── Tag 名称自动填充
└── 统一版本控制器（version.ts）
```

---

## 目录结构

```
VideoFileProcessing/
├── doc/                          # 项目文档
│   ├── workspace.md              # 工作台技术文档
│   ├── scrape.md                 # 搜刮技术文档
│   ├── nodetoworkflow.md         # 节点→工作流架构演进分析
│   └── ...
├── src/                          # 后端源码
│   ├── electron/                 # Electron 桌面端
│   │   ├── main.ts               # 主进程入口（Express + 窗口管理）
│   │   └── preload.ts            # IPC 安全暴露脚本
│   ├── api/
│   │   ├── flows.ts              # 工作流 + 搜刮 REST API
│   │   ├── tags.ts               # Tag 管理 REST API（含排序）
│   │   └── settings.ts           # 设置持久化 REST API
│   ├── core/                     # 核心引擎
│   │   ├── runner.ts             # FlowRunner（并发调度 + Checkpoint）
│   │   ├── context.ts            # IFileContext 接口
│   │   ├── node.ts               # INode + Config 接口 + 枚举
│   │   ├── flow.ts               # IFlow + IEdge 接口
│   │   ├── tag-strategy.ts       # ITagStrategy 预留接口
│   │   └── index.ts              # Barrel export
│   ├── db/                       # 数据库层
│   │   ├── sqlite.ts             # better-sqlite3 封装 + 状态机
│   │   └── recovery.ts           # RecoveryManager 崩溃恢复
│   ├── factory/
│   │   └── node-factory.ts       # NodeFactory（JSON → 真实类实例）
│   ├── nodes/                    # 节点实现
│   │   ├── watcher.ts            # WatcherNode（chokidar）
│   │   ├── tagger.ts             # TaggerNode（打标规则）
│   │   └── mover.ts              # MoverNode（安全移动 + withRetry）
│   ├── utils/                    # 工具函数
│   │   ├── retry.ts              # withRetry 装饰器 + 错误分类
│   │   ├── io.ts                 # safeMoveFile + resolveTemplate
│   │   └── queue.ts              # PromiseQueue 并发队列
│   ├── version.ts                # 统一版本控制器
│   ├── server.ts                 # Express 服务入口（非 Electron 模式）
│   ├── main.ts                   # Node.js CLI 入口（已弃用）
│   └── config.ts                 # 环境变量配置读取
├── web/                          # 前端源码（Vite React）
│   ├── src/
│   │   ├── App.tsx               # 主应用组件（全局状态管理）
│   │   ├── main.tsx              # React 入口
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx   # 全局主题管理（亮色/暗色）
│   │   ├── components/
│   │   │   ├── FileList.tsx      # 工作台文件列表（含 TagInput）
│   │   │   ├── ScrapePage.tsx    # 搜刮页面（无状态展示组件）
│   │   │   ├── StatsDashboard.tsx     # 工作台统计仪表盘（5 卡片）
│   │   │   ├── ScrapeStatsDashboard.tsx # 搜刮统计仪表盘（3 卡片）
│   │   │   ├── LogTerminal.tsx   # 实时日志终端
│   │   │   ├── Sidebar.tsx       # 左侧导航栏（工作台/搜刮/Tag管理/设置）
│   │   │   ├── TagManagement.tsx # Tag 管理页面（CRUD + 拖拽排序）
│   │   │   ├── SettingsPage.tsx  # 设置页面（主题/版本/搜刮路径/自动填充）
│   │   │   ├── Toast.tsx         # 全局通知组件
│   │   │   ├── ErrorQueue.tsx    # 错误队列管理
│   │   │   ├── FlowCanvas.tsx    # React Flow 画布（历史遗留）
│   │   │   ├── NodePanel.tsx     # 节点面板（历史遗留）
│   │   │   ├── PropertyPanel.tsx # 属性面板（历史遗留）
│   │   │   └── nodes/            # 自定义 React Flow 节点（历史遗留）
│   │   ├── hooks/
│   │   │   └── useSocket.ts      # Socket.io 客户端 Hook
│   │   └── utils/
│   │       └── flow-converter.ts # 前后端数据映射转换器
│   ├── index.html
│   ├── package.json
│   └── tsconfig.json
├── package.json                  # 根 package.json（Electron 构建）
├── tsconfig.json                 # TypeScript 配置（后端）
├── tsconfig.electron.json        # TypeScript 配置（Electron 主进程）
├── .env                          # 环境变量配置（CLI 模式）
└── data/                         # SQLite 数据库文件（运行时生成）
    └── vfp.db
```

---

## 功能模块

### 工作台（Workspace）

基于 Tag 的视频文件分类归档系统。

**流程：** 设置源目录 → 加载文件列表 → 为文件分配 Tag → 启动处理 → 文件按 Tag 移动到对应目标路径

**节点链路：** `TaggerNode(UserTag) → MoverNode`

**统计面板：** 待处理 / 已标记 / 总计 / 已处理 / 失败

详见 [doc/workspace.md](doc/workspace.md)

### 搜刮（Scrape）

批量递归扫描 + 统一导出系统。

**流程：** 设置搜刮目录 + 导出目录 + 深度 → 加载（递归扫描）→ 启动 → 文件统一移动到导出目录

**节点链路：** `MoverNode`（单节点，无 TaggerNode）

**统计面板：** 总计 / 已处理 / 失败

详见 [doc/scrape.md](doc/scrape.md)

### 功能对比

| 特性 | 工作台 | 搜刮 |
|------|--------|------|
| 文件来源 | 单一源目录（平铺扫描） | 递归扫描（深度 0-4 可配） |
| 分类方式 | 基于 Tag 分类到不同目录 | 统一导出到单一目录 |
| Tag 功能 | 有（选择、自动填充） | 无 |
| 节点链路 | TaggerNode → MoverNode | 仅 MoverNode |
| Socket.io 房间 | `flow:flow-batch` | `flow:scrape-flow` |
| 统计卡片数 | 5 | 3 |

---

## 核心模块详解

### 1. 数据模型层

#### IFileContext（文件流转上下文）

```typescript
interface IFileContext {
  traceId: string;              // UUID v4，全链路追踪标识
  originalFileName: string;     // 原始文件名
  originalPath: string;         // 原始文件路径
  currentPath: string;          // 当前文件路径（随移动改变）
  tags: string[];               // 标签集合
  metadata: Record<string, any>;// 扩展元数据（userTag/targetPath/exportDir 等）
}
```

#### INode<TConfig>（泛型节点接口）

```typescript
interface INode<TConfig = unknown> {
  id: string;                   // 节点唯一 ID
  type: NodeType;              // 节点类型枚举（Watcher/Tagger/Mover）
  config: TConfig;             // 泛型配置
  handle(ctx: IFileContext): Promise<IFileContext>;
}
```

#### IFlow（工作流模型）

```typescript
interface IFlow {
  id: string;
  name: string;
  nodes: INode[];
  edges: IEdge[];               // sourceId → targetId
}
```

### 2. 引擎层

#### FlowRunner（核心调度器）

职责：
- 构建邻接表实现线性执行链（V1 仅支持线性管道）
- 手写 `PromiseQueue` 限制并发（默认 5）
- **Checkpoint 持久化**：每个关键节点执行前后写入 SQLite
- 错误隔离：单文件失败不影响整体运行
- 事件发射：通过 `EventEmitter` 向 WebSocket 推送日志

执行逻辑：
```
PENDING（入队写入 SQLite）
  → RUNNING（节点执行前更新）
    → node.handle(ctx)
      → MOVED（如果是 MoverNode 成功）
        → COMPLETED（流转完成）
      → ERROR（异常时）
```

#### PromiseQueue（并发队列）

手写实现的 Promise 并发控制队列，支持：
- 限制同时执行的任务数量
- 自动调度新任务
- 提供 `size`（排队中）和 `pending`（执行中）统计

### 3. 节点层

#### WatcherNode

- **技术选型**：chokidar
- **防抖机制**：`awaitWriteFinish`（稳定性阈值 2000ms）
- **初始化**：`init(callback)` 启动监听
- **文件过滤**：支持正则表达式匹配文件名

#### TaggerNode

支持四种 Tag 生成规则：
- **UUID**：`randomUUID()` 生成唯一标识
- **RegexExtract**：从文件名或路径正则提取内容
- **FixedPrefix**：固定前缀 + 文件名
- **UserTag**：从 `ctx.metadata.userTag` 读取用户指定的 Tag（工作台使用）

注意：纯内存操作，不涉及磁盘 IO。

#### MoverNode

- **模板解析**：支持 `{filename}`、`{tag[n]}`、`{metadata.xxx}`、`{YYYY}`、`{MM}`、`{DD}` 等变量
- **安全移动**：
  1. 自动递归创建目标目录
  2. 优先使用 `fs.rename`（原子操作）
  3. 跨盘时降级为 `fs.copyFile + fs.unlink`
- **IO 重试**：使用 `withRetry` 包装，支持 3 次指数退避

### 4. 持久化层

#### SQLite 表结构

**tbl_flows** — 工作流配置
```sql
CREATE TABLE tbl_flows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nodes_json TEXT NOT NULL,
  edges_json TEXT NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);
```

**tbl_context_history** — Checkpoint 核心表
```sql
CREATE TABLE tbl_context_history (
  trace_id TEXT PRIMARY KEY,
  flow_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  original_file_name TEXT NOT NULL,
  original_path TEXT NOT NULL,
  current_path TEXT NOT NULL,
  tags_json TEXT DEFAULT '[]',
  metadata_json TEXT DEFAULT '{}',
  current_node_id TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);
```

**tbl_tags** — Tag 管理表
```sql
CREATE TABLE tbl_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  target_path TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);
```

**tbl_settings** — 应用设置表
```sql
CREATE TABLE tbl_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at INTEGER
);
```

**支持的设置项：**

| Key | 说明 | 默认值 |
|-----|------|--------|
| `sourceDir` | 工作台源文件目录 | `./wfp` |
| `theme` | 主题模式（light/dark） | `light` |
| `scrapeSourceDir` | 搜刮源目录 | 空 |
| `scrapeExportDir` | 搜刮导出目录 | 空 |
| `scrapeDepth` | 搜刮递归深度 | `1` |
| `autoFillTagName` | Tag 名称自动填充开关 | `false` |

#### RecoveryManager（崩溃恢复）

应用启动时自动执行：
1. 查询状态为 `RUNNING` 或 `PENDING` 的记录
2. `RUNNING` → 生成告警，提示人工检查文件状态
3. `PENDING` → 可自动重新入队处理

### 5. 错误处理层

#### withRetry 装饰器

```typescript
await withRetry(
  () => safeMoveFile(src, dest),
  {
    maxRetries: 3,           // 最大重试次数
    baseDelay: 1000,         // 初始延迟 1s
    backoffMultiplier: 2,    // 指数退避：1s, 2s, 4s
    retryOnlyTransient: true,// 仅对瞬时错误重试
  }
);
```

#### 错误分类

| 类型 | 错误码 | 说明 |
|------|--------|------|
| **瞬时错误** | EBUSY, EAGAIN, ETIMEDOUT, ECONNRESET, EPIPE, ENETUNREACH, ENOENT | 文件占用、网络断连等，可重试 |
| **致命错误** | EACCES, EPERM, ENOSPC, EISDIR, ENOTDIR | 权限拒绝、磁盘满等，不应重试 |
| **未知错误** | 其他 | 根据消息内容判断 |

### 6. 前后端映射层

#### NodeFactory（工厂模式）

后端 API 接收到前端传来的 Flow JSON 后，不能直接拿纯 JSON 去跑。`NodeFactory` 根据 `type` 字段实例化真实类：

```typescript
NodeFactory.create({
  id: 'node-tagger',
  type: 'tagger',
  config: { rules: [{ type: 'user_tag', params: {} }] }
});
// → 返回 TaggerNode 实例
```

### 7. 桌面端层

#### Electron 主进程

- **Main Process**：运行 Express + Socket.io + FlowRunner 引擎
- **Renderer Process**：React 前端
- **IPC 通信**：
  - `dialog:openDirectory` — 本地文件夹选择对话框
  - `db:getStats` / `db:getErrors` / `db:discard` — 数据库操作
  - `recovery:check` — 崩溃恢复检查

---

## 状态机设计

文件流转的完整状态机：

```
                    ┌─────────────┐
                    │   PENDING   │ ← 文件进入队列（写入 SQLite）
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
            ┌──────│   RUNNING   │ ← 节点执行前更新状态
            │      └──────┬──────┘
            │             │
            │      ┌──────┴──────┐
            │      │             │
            │      ▼             ▼
            │ ┌────────┐   ┌──────────┐
            │ │ MOVED  │   │ COMPLETED│ ← 所有节点执行完毕
            │ └───┬────┘   └──────────┘
            │     │
            │     ▼
            │ ┌──────────┐
            └─│  ERROR   │ ← 异常捕获
              └────┬─────┘
                   │
                   ▼
              ┌──────────┐
              │DISCARDED │ ← 用户手动丢弃
              └──────────┘
```

---

## API 接口总览

### 工作台

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/scan` | 扫描源目录视频文件 |
| POST | `/api/flows/:id/start` | 启动工作流 |
| POST | `/api/flows/:id/stop` | 停止工作流 |

### 搜刮

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/scrape/scan` | 递归扫描搜刮目录 |
| POST | `/api/scrape/start` | 启动搜刮 |
| POST | `/api/scrape/stop` | 停止搜刮 |

### Tag 管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tags` | 获取所有 Tag（按 sort_order 排序） |
| GET | `/api/tags/:id` | 获取单个 Tag |
| POST | `/api/tags` | 创建 Tag |
| PUT | `/api/tags/:id` | 更新 Tag |
| PUT | `/api/tags/reorder` | 拖拽排序 Tag |
| DELETE | `/api/tags/:id` | 删除 Tag |

### 设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings/:key` | 读取设置 |
| POST | `/api/settings/:key` | 写入设置 |
| GET | `/api/version` | 获取版本信息 |

---

## 实时通信（Socket.io）

| 房间 | 用途 |
|------|------|
| `flow:flow-batch` | 工作台日志推送 |
| `flow:scrape-flow` | 搜刮日志推送 |

**日志事件类型：**

| event | 触发时机 |
|-------|---------|
| `enqueue` | 文件入队 |
| `node_start` | 节点开始执行 |
| `node_complete` | 节点执行完成 |
| `flow_complete` | 文件处理完成 |
| `error` | 处理出错 |

---

## 安全设计

1. **不修改视频二进制**：V1 只做文件路径移动和元数据处理
2. **跨盘安全移动**：`fs.rename` 失败时自动降级为 copy+unlink
3. **错误隔离**：单文件失败不会导致 Runner 崩溃
4. **并发控制**：内存队列限制同时处理文件数（默认 5）
5. **崩溃恢复**：SQLite Checkpoint 记录每个关键状态
6. **防重入**：UPSERT 语义确保同一 traceId 不会重复插入
7. **UUID 文件标识**：每个文件使用 `crypto.randomUUID()` 生成唯一 ID，避免文件名冲突

---

## 开发命令

```bash
# TypeScript 类型检查
npx tsc --noEmit                        # 后端
npx tsc -p tsconfig.electron.json --noEmit  # Electron 主进程
cd web && npx tsc --noEmit              # 前端

# 开发运行
npm run electron:dev                    # Electron 开发模式（热重载）

# 构建
cd web && npm run build                 # 前端构建
npx tsc -p tsconfig.electron.json       # Electron 后端构建
npm run electron:build                  # 打包 exe
```

---

*文档版本: V1.1.5 | 最后更新: 2026-05-09*