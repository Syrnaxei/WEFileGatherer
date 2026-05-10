# SVFP — 视频文件流处理系统 V1

## 项目概述

**SVFP**（Syrnaxies Video File Processor）是一个基于工作流引擎的视频文件批处理系统。V1 版本的核心功能是"**文件路径移动与元数据打标**"，不涉及任何视频编解码操作。

系统将视频文件视为在管道中流动的数据包，经过各节点处理后，最终移动到目标位置。当前版本采用**批处理表格界面**，用户加载视频文件、分配 Tag，一键启动工作流完成自动分类归档。

### 核心特性

- **批处理工作流**：表格形式管理视频文件，按 Tag 自动归档到目标路径
- **Tag 管理系统**：支持创建/编辑/删除 Tag，每个 Tag 绑定独立的目标路径
- **文件监听与防抖**：使用 chokidar 监听目录，确保大文件拷贝完成后再处理
- **智能打标系统**：支持 UUID、正则提取、固定前缀等多种 Tag 生成规则
- **安全文件移动**：支持跨磁盘分区移动，自动降级为 copy+unlink
- **并发队列控制**：限制同时处理的文件数量，防止 IO 风暴
- **SQLite 状态持久化**：Checkpoint 机制防止崩溃导致文件丢失
- **指数退避重试**：对瞬时 IO 错误自动重试
- **实时日志推送**：WebSocket 实时展示文件流转状态
- **桌面端封装**：Electron 封装为独立应用，支持本地文件夹选择对话框
- **夜间模式**：支持亮色/暗色主题切换，偏好自动持久化

---

## 系统架构

### 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Vite + React 19 + TypeScript |
| 实时通信 | Socket.io Client |
| 后端服务 | Express + Socket.io |
| 数据库 | better-sqlite3（事务级持久化）|
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
├── TaggerNode（UUID/Regex/FixedPrefix）
├── MoverNode（safeMoveFile + 模板解析）
└── PromiseQueue（手写并发控制队列）

Phase 3: Web GUI 批处理界面
├── 文件列表表格（加载、Tag 分配、移除）
├── 侧边栏导航（工作区 / Tag 管理 / 设置）
├── 统计仪表盘（实时状态计数）
├── 实时日志终端（WebSocket 推送）
├── REST API（Express）
└── 前后端数据映射转换器

Phase 4: 生产级加固与桌面端
├── SQLite Checkpoint 状态机（PENDING/RUNNING/MOVED/ERROR）
├── withRetry 装饰器（指数退避 + 错误分类）
├── RecoveryManager（崩溃恢复）
├── Electron 主进程封装
├── IPC 本地文件对话框
├── 统计仪表盘 + 错误队列管理
├── 全局主题系统（亮色/暗色模式）
└── 设置持久化（SQLite）
```

---

## 目录结构

```
VideoFileProcessing/
├── doc/                          # 项目文档
│   ├── README.md                 # 架构总览（本文档）
│   └── USAGE.md                  # 使用方法
├── src/                          # 后端源码
│   ├── electron/                 # Electron 桌面端
│   │   ├── main.ts               # 主进程入口（Express + 窗口管理）
│   │   └── preload.ts            # IPC 安全暴露脚本
│   ├── api/
│   │   ├── flows.ts              # 工作流 REST API
│   │   ├── tags.ts               # Tag 管理 REST API
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
│   │   └── node-factory.ts       # NodeFactory（JSON -> 真实类实例）
│   ├── nodes/                    # 节点实现
│   │   ├── watcher.ts            # WatcherNode（chokidar）
│   │   ├── tagger.ts             # TaggerNode（打标规则）
│   │   └── mover.ts              # MoverNode（安全移动 + withRetry）
│   ├── utils/                    # 工具函数
│   │   ├── retry.ts              # withRetry 装饰器 + 错误分类
│   │   ├── io.ts                 # safeMoveFile + resolveTemplate
│   │   └── queue.ts              # PromiseQueue 并发队列
│   ├── types/
│   │   └── better-sqlite3.d.ts   # 类型声明文件
│   ├── server.ts                 # Express 服务入口（非 Electron 模式）
│   ├── main.ts                   # Node.js CLI 入口
│   ├── config.ts                 # 环境变量配置读取
│   └── example.ts                # MoverNode 实例化示例
├── web/                          # 前端源码（Vite React）
│   ├── src/
│   │   ├── App.tsx               # 主应用组件（路由 + 布局）
│   │   ├── main.tsx              # React 入口
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx  # 全局主题管理（亮色/暗色）
│   │   ├── components/
│   │   │   ├── FileList.tsx      # 文件列表表格（核心工作区）
│   │   │   ├── StatsDashboard.tsx# 顶部统计仪表盘
│   │   │   ├── LogTerminal.tsx   # 底部日志终端
│   │   │   ├── Sidebar.tsx       # 左侧导航栏
│   │   │   ├── TagManagement.tsx # Tag 管理页面（CRUD）
│   │   │   ├── SettingsPage.tsx  # 设置页面（主题、版本信息）
│   │   │   ├── Toast.tsx         # 全局通知组件
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

## 核心模块详解

### 1. 数据模型层

#### IFileContext（文件流转上下文）

```typescript
interface IFileContext {
  traceId: string;              // 唯一流转 ID
  originalFileName: string;     // 原始文件名
  originalPath: string;         // 原始文件路径
  currentPath: string;          // 当前文件路径（随移动改变）
  tags: string[];               // 标签集合
  metadata: Record<string, any>;// 扩展元数据
}
```

#### INode<TConfig>（泛型节点接口）

```typescript
interface INode<TConfig = unknown> {
  id: string;                   // 节点唯一 ID
  type: NodeType;              // 节点类型枚举
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
  edges: IEdge[];               // sourceId -> targetId
}
```

### 2. 引擎层

#### FlowRunner（核心调度器）

职责：
- 构建邻接表实现线性执行链
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

支持三种 Tag 生成规则：
- **UUID**：`randomUUID()` 生成唯一标识
- **RegexExtract**：从文件名或路径提取内容
- **FixedPrefix**：固定前缀 + 文件名

注意：纯内存操作，不涉及磁盘 IO。

#### MoverNode

- **模板解析**：支持 `{filename}`、`{tag[n]}`、`{metadata.xxx}`、`{YYYY}` 等变量
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
| **瞬时错误** | EBUSY, EAGAIN, ETIMEDOUT, ENOENT | 文件占用、网络断连等，可重试 |
| **致命错误** | EACCES, EPERM, ENOSPC | 权限拒绝、磁盘满等，不应重试 |
| **未知错误** | 其他 | 根据消息内容判断 |

### 6. 前后端映射层

#### NodeFactory（工厂模式）

后端 API 接收到前端传来的 Flow JSON 后，不能直接拿纯 JSON 去跑。`NodeFactory` 根据 `type` 字段实例化真实类：

```typescript
NodeFactory.create({
  id: 'node-1',
  type: 'watcher',
  config: { watchPath: './input', filePattern: '*.mp4' }
});
// → 返回 WatcherNode 实例
```

#### Flow Converter

- **backendToFrontend**：将后端 `IFlow` 转换为 React Flow 的 `Node[]` 和 `Edge[]`
- **frontendToBackend**：将 React Flow 数据转换为后端 `IFlow`，保留 `__position` 节点位置

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

## 安全设计

1. **不修改视频二进制**：V1 只做文件路径移动和元数据处理
2. **跨盘安全移动**：`fs.rename` 失败时自动降级为 copy+unlink
3. **错误隔离**：单文件失败不会导致 Runner 崩溃
4. **并发控制**：内存队列限制同时处理文件数（默认 5）
5. **崩溃恢复**：SQLite Checkpoint 记录每个关键状态
6. **防重入**：UPSERT 语义确保同一 traceId 不会重复插入

---

*文档版本: V1.1 | 最后更新: 2026-05-06*
