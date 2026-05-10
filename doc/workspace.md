# 工作台（Workspace）技术文档

> 版本：1.1.5 | 最后更新：2026-05-09

## 1. 功能概述

工作台是 SVFP 的核心功能模块，提供基于 Tag 的视频文件分类与移动能力。用户通过为视频文件分配 Tag，系统根据 Tag 绑定的目标路径将文件移动到对应目录。

### 1.1 核心流程

```
设置源目录 → 加载文件列表 → 为文件分配 Tag → 启动处理 → 文件移动至目标路径
```

### 1.2 与搜刮的区别

| 特性 | 工作台 | 搜刮 |
|------|--------|------|
| 文件来源 | 单一源目录（平铺扫描） | 递归扫描（可配置深度） |
| 分类方式 | 基于 Tag 分类到不同目录 | 统一导出到单一目录 |
| 节点链路 | TaggerNode → MoverNode | 仅 MoverNode |
| 前置条件 | 源目录 + Tag 配置 | 搜刮目录 + 导出目录 |

---

## 2. 后端逻辑实现

### 2.1 架构层次

```
Express Router (src/api/flows.ts)
    ↓
FlowRunner (src/core/runner.ts)
    ↓
Node Pipeline: TaggerNode → MoverNode
    ↓
SQLite Checkpoint (src/db/sqlite.ts)
```

### 2.2 API 接口设计

#### 2.2.1 扫描文件 `POST /api/scan`

扫描指定目录下的视频文件（非递归，仅平铺）。

**请求体：**
```json
{
  "directory": "D:/videos/source"
}
```

**成功响应（200）：**
```json
{
  "success": true,
  "files": [
    {
      "id": "uuid-v4",
      "fileName": "video1.mp4",
      "filePath": "D:/videos/source/video1.mp4",
      "tag": ""
    }
  ]
}
```

**错误响应：**
| 状态码 | 说明 |
|--------|------|
| 400 | `directory` 参数缺失 |
| 500 | 目录读取失败（权限不足、路径不存在等） |

**支持的文件格式：** `.mp4` `.avi` `.mkv` `.mov` `.wmv` `.flv` `.webm`

**技术细节：** 每个文件在扫描时即分配 UUID v4 作为唯一标识（`crypto.randomUUID()`），用于后续全链路追踪。

#### 2.2.2 启动工作流 `POST /api/flows/:id/start`

启动批量文件处理流程。固定使用 `flow-batch` 作为 flowId。

**请求体：**
```json
{
  "files": [
    {
      "id": "uuid",
      "fileName": "video1.mp4",
      "filePath": "D:/videos/source/video1.mp4",
      "tag": "纪录片"
    }
  ]
}
```

**成功响应（200）：**
```json
{
  "success": true,
  "message": "Started processing 3 files"
}
```

**错误响应：**
| 状态码 | 场景 |
|--------|------|
| 400 | `files` 为空或非数组 |
| 400 | 所有文件均未设置 tag |
| 400 | 存在未配置目标路径的 tag |

**前置校验逻辑：**

1. 过滤掉 `tag` 为空的文件（仅处理已标记文件）
2. 从 `tbl_tags` 表查询每个 tag 对应的 `target_path`
3. 若存在未配置路径的 tag，返回错误并列出缺失的 tag 名称

#### 2.2.3 停止工作流 `POST /api/flows/:id/stop`

停止正在运行的工作流。

**成功响应（200）：**
```json
{ "success": true, "message": "Flow flow-batch stopped" }
```

**错误响应：**
| 状态码 | 说明 |
|--------|------|
| 404 | 指定 flowId 没有正在运行的实例 |

### 2.3 工作流构建

启动时动态构建 Flow 对象：

```typescript
const flow: IFlow = {
  id: 'flow-batch',
  name: 'Batch Processing',
  nodes: [
    NodeFactory.create({ id: 'node-tagger', type: 'tagger', config: { rules: [{ type: 'user_tag' }] } }),
    NodeFactory.create({ id: 'node-mover', type: 'mover', config: { targetPathTemplate: '{metadata.targetPath}/{filename}', overwrite: false } }),
  ],
  edges: [{ sourceId: 'node-tagger', targetId: 'node-mover' }],
};
```

**节点链路：** `TaggerNode(UserTag) → MoverNode`

- **TaggerNode**：从 `ctx.metadata.userTag` 读取用户分配的 tag 名称，写入 `ctx.tags`
- **MoverNode**：使用模板 `{metadata.targetPath}/{filename}` 解析目标路径，执行文件移动

### 2.4 FlowRunner 执行引擎

[FlowRunner](file:///e:/AAAProject/VideoFileProcessing/src/core/runner.ts) 是核心执行引擎，负责：

1. **并发控制**：通过 `PromiseQueue` 限制同时处理的文件数（默认并发数 5）
2. **DAG 遍历**：根据 `edges` 构建邻接表，从入口节点开始顺序执行
3. **状态机管理**：每个文件经历 `PENDING → RUNNING → MOVED → COMPLETED` 状态流转
4. **Checkpoint 写入**：每次状态变更写入 SQLite `tbl_context_history` 表
5. **事件发射**：通过 EventEmitter 向 Socket.io 推送实时日志

#### 状态机

```
PENDING ──→ RUNNING ──→ MOVED ──→ COMPLETED
                 ↘
                 ERROR
```

#### 上下文对象（IFileContext）

```typescript
interface IFileContext {
  traceId: string;          // UUID，全链路追踪标识
  originalFileName: string; // 原始文件名
  originalPath: string;     // 原始绝对路径
  currentPath: string;      // 当前路径（移动后更新）
  tags: string[];           // 标签列表
  metadata: Record<string, any>; // 扩展元数据
}
```

工作台启动时注入的 metadata：
```json
{
  "userTag": "纪录片",
  "targetPath": "D:/output/纪录片",
  "detectedAt": "2026-05-09T..."
}
```

### 2.5 节点实现

#### TaggerNode（打标节点）

[源码](file:///e:/AAAProject/VideoFileProcessing/src/nodes/tagger.ts)

- 职责：根据配置规则为文件生成 Tag
- 工作台使用 `UserTag` 规则：从 `ctx.metadata.userTag` 读取
- 纯内存操作，不涉及磁盘 IO
- 单个规则失败不影响其他规则执行

支持的规则类型：
| 规则 | 说明 |
|------|------|
| `uuid` | 生成 UUID 作为 tag |
| `regex_extract` | 正则从文件名提取 |
| `fixed_prefix` | 固定前缀 + 文件名 |
| `user_tag` | 从 metadata 读取用户指定 tag |

#### MoverNode（移动节点）

[源码](file:///e:/AAAProject/VideoFileProcessing/src/nodes/mover.ts)

- 职责：将文件移动到目标路径
- 使用 `resolveTemplate()` 解析路径模板
- 通过 `withRetry()` 包装 IO 操作，支持指数退避重试

### 2.6 路径模板解析

[resolveTemplate](file:///e:/AAAProject/VideoFileProcessing/src/utils/io.ts) 支持的占位符：

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{filename}` | 当前文件名 | `video1.mp4` |
| `{originalFilename}` | 原始文件名 | `video1.mp4` |
| `{ext}` | 扩展名 | `.mp4` |
| `{tag}` | 第一个标签 | `纪录片` |
| `{tag[n]}` | 第 n 个标签 | `纪录片` |
| `{metadata.xxx}` | metadata 字段 | `D:/output/纪录片` |
| `{YYYY}` `{MM}` `{DD}` | 日期占位符 | `2026` `05` `09` |

工作台使用的模板：`{metadata.targetPath}/{filename}`

### 2.7 IO 重试机制

[withRetry](file:///e:/AAAProject/VideoFileProcessing/src/utils/retry.ts) 配置：

| 参数 | 值 |
|------|-----|
| 最大重试次数 | 3 |
| 初始延迟 | 1000ms |
| 退避乘数 | 2（指数退避） |
| 最大延迟 | 30000ms |

**错误分类：**
- **瞬时错误（可重试）：** `EBUSY` `EAGAIN` `ETIMEDOUT` `ECONNRESET` `EPIPE` `ENETUNREACH` `ENOENT`
- **致命错误（不重试）：** `EACCES` `EPERM` `ENOSPC` `EISDIR` `ENOTDIR`

**跨设备移动：** `safeMoveFile` 检测 `EXDEV` 错误码，自动降级为 `copyFile + unlink`。

---

## 3. 前后端交互逻辑

### 3.1 通信架构

```
React (web/src/App.tsx)
    │
    ├── HTTP REST (fetch)
    │   ├── POST /api/scan          → 扫描文件
    │   ├── POST /api/flows/:id/start → 启动工作流
    │   ├── POST /api/flows/:id/stop  → 停止工作流
    │   ├── GET  /api/tags           → 获取 Tag 列表
    │   └── GET/POST /api/settings/:key → 读写设置
    │
    └── WebSocket (Socket.io)
        └── room: flow:flow-batch
            ├── subscribe → 加入房间
            └── log event → 接收实时日志
```

### 3.2 状态管理

所有状态集中在 [App.tsx](file:///e:/AAAProject/VideoFileProcessing/web/src/App.tsx) 管理：

| 状态 | 类型 | 说明 |
|------|------|------|
| `files` | `FileItem[]` | 文件列表（含 tag、status） |
| `wfpPath` | `string` | 源文件目录路径 |
| `isRunning` | `boolean` | 是否正在处理 |
| `savedTags` | `SavedTag[]` | 已配置的 Tag 列表 |
| `processedCount` | `number` | 已处理文件计数 |
| `flowId` | `string` | 固定为 `'flow-batch'` |

### 3.3 实时通信（Socket.io）

[useSocket Hook](file:///e:/AAAProject/VideoFileProcessing/web/src/hooks/useSocket.ts) 管理 WebSocket 连接：

1. 组件挂载时连接 `http://localhost:3000`
2. 连接成功后自动发送 `subscribe` 事件加入 `flow:flow-batch` 房间
3. 监听 `log` 事件接收后端推送

**日志事件类型：**

| event | 触发时机 | 携带数据 |
|-------|---------|---------|
| `enqueue` | 文件入队 | `traceId`, `fileName` |
| `node_start` | 节点开始执行 | `nodeId`, `nodeType`, `traceId` |
| `node_complete` | 节点执行完成 | `nodeId`, `nodeType`, `traceId` |
| `flow_complete` | 文件处理完成 | `traceId`, `fileName` |
| `error` | 处理出错 | `traceId`, `error`, `nodeId` |

**前端状态更新逻辑：**
- `flow_complete` 事件 → 将 `traceId` 加入 `completedIds` Set
- `error` 事件 → 将 `traceId` 加入 `failedIds` Set
- `completedCount = completedIds.size + failedIds.size`
- 当 `completedCount >= 已标记文件数` 时，自动将 `isRunning` 设为 `false`

### 3.4 按钮交互规则

| 状态 | 启动按钮 | 停止按钮 | 加载按钮 |
|------|---------|---------|---------|
| 列表为空 | 禁用（灰） | 禁用（灰） | 可用 |
| 未运行 + 有文件 | 可用（绿） | 禁用（灰） | 可用 |
| 运行中 | 禁用（灰） | 可用（红） | 可用 |

禁用状态视觉反馈：背景色 `#6b7280`、光标 `not-allowed`、透明度 `0.6`。

### 3.5 设置持久化

源文件目录路径通过 `tbl_settings` 表持久化：

- **读取：** `GET /api/settings/sourceDir`（App 挂载时）
- **写入：** `POST /api/settings/sourceDir`（每次修改时自动保存）

---

## 4. 数据流转过程

### 4.1 完整时序

```
用户操作              前端                     后端                     数据库
  │                   │                       │                       │
  ├─ 设置源目录 ──────→│ setWfpPath()          │                       │
  │                   │─ POST /settings/sourceDir ──────────────────→│ UPSERT tbl_settings
  │                   │                       │                       │
  ├─ 点击加载 ────────→│ handleLoad()          │                       │
  │                   │─ POST /api/scan ──────→│ fs.readdir()         │
  │                   │←── files[] ───────────│ 生成 UUID             │
  │                   │ setFiles(data.files)   │                       │
  │                   │                       │                       │
  ├─ 选择 Tag ───────→│ handleTagChange()     │                       │
  │                   │ setFiles(prev)         │                       │
  │                   │                       │                       │
  ├─ 点击启动 ────────→│ handleStart()         │                       │
  │                   │─ 前端校验 tag 配置      │                       │
  │                   │─ POST /flows/:id/start→│ 构建 Flow             │
  │                   │                       │─ 查询 tag→target_path  │→ SELECT tbl_tags
  │                   │                       │─ new FlowRunner()     │
  │                   │                       │─ runner.enqueue()     │→ INSERT tbl_context_history
  │                   │                       │                       │  (status=PENDING)
  │                   │←── {success:true} ────│                       │
  │                   │ subscribe(flowId)     │                       │
  │                   │                       │                       │
  │                   │  ←── log: enqueue ────│ emit('log')           │
  │                   │                       │                       │
  │                   │                       │─ TaggerNode.handle()  │→ UPDATE (status=RUNNING)
  │                   │  ←── log: node_start ─│                       │
  │                   │  ←── log: node_complete│                      │
  │                   │                       │                       │
  │                   │                       │─ MoverNode.handle()   │→ UPDATE (status=RUNNING)
  │                   │                       │  safeMoveFile()       │
  │                   │                       │  withRetry()          │
  │                   │  ←── log: node_start ─│                       │
  │                   │  ←── log: node_complete│                      │→ UPDATE (status=MOVED)
  │                   │                       │                       │→ UPDATE (status=COMPLETED)
  │                   │  ←── log: flow_complete│                      │
  │                   │ completedIds.add(id)   │                       │
  │                   │                       │                       │
  │                   │ completedCount >= N    │                       │
  │                   │ setIsRunning(false)    │                       │
```

### 4.2 文件移动路径解析

```
用户输入 tag: "纪录片"
    ↓
查询 tbl_tags WHERE name='纪录片' → target_path = "D:/output/纪录片"
    ↓
构建 metadata: { userTag: "纪录片", targetPath: "D:/output/纪录片" }
    ↓
TaggerNode: ctx.tags = ["纪录片"]
    ↓
MoverNode: resolveTemplate("{metadata.targetPath}/{filename}", ctx)
    ↓
目标路径: "D:/output/纪录片/video1.mp4"
    ↓
safeMoveFile("D:/videos/source/video1.mp4", "D:/output/纪录片/video1.mp4")
```

---

## 5. 关键业务规则

### 5.1 Tag 校验规则

1. 启动时仅处理 `tag` 非空的文件
2. 每个 tag 必须在 `tbl_tags` 中存在对应记录
3. 每个 tag 必须配置了 `target_path`（非空字符串）
4. 前端和后端各执行一次校验，双重保障

### 5.2 并发控制

- 默认并发数：5（`new FlowRunner(flow, 5)`）
- 通过 `PromiseQueue` 实现，队列满时新任务等待

### 5.3 崩溃恢复

[RecoveryManager](file:///e:/AAAProject/VideoFileProcessing/src/db/recovery.ts) 在应用启动时检查：

- `RUNNING` 状态记录 → 生成警告（文件可能在移动中途中断）
- `PENDING` 状态记录 → 可安全重新入队

### 5.4 文件标识

- 每个文件在扫描时分配 UUID v4（`crypto.randomUUID()`）
- UUID 作为 `traceId` 贯穿整个处理链路
- 前端通过 UUID 追踪每个文件的处理状态（`completedIds` / `failedIds`）

---

## 6. 技术选型依据

| 技术 | 用途 | 选型原因 |
|------|------|---------|
| Express.js | HTTP 服务 | 轻量、生态成熟、与 Electron 集成简单 |
| Socket.io | 实时通信 | 自动降级（WebSocket → 长轮询）、房间机制、断线重连 |
| better-sqlite3 | 数据持久化 | 同步 API 简化代码、零配置、与 Electron 兼容性好 |
| SQLite WAL 模式 | 并发写入 | 读写不互斥，适合 Checkpoint 高频写入场景 |
| PromiseQueue | 并发控制 | 自实现轻量队列，避免引入 Bull/Redis 等重量级依赖 |
| EventEmitter | 内部事件 | Node.js 原生，FlowRunner 继承后直接 emit 日志事件 |
| crypto.randomUUID() | 文件标识 | Node.js 19+ 原生支持，无需第三方 UUID 库 |
| React + Vite | 前端框架 | 快速 HMR、TypeScript 原生支持、构建产物小 |

---

## 7. 相关文件索引

| 文件 | 职责 |
|------|------|
| [src/api/flows.ts](file:///e:/AAAProject/VideoFileProcessing/src/api/flows.ts) | API 路由（scan、flows CRUD、启动/停止） |
| [src/api/tags.ts](file:///e:/AAAProject/VideoFileProcessing/src/api/tags.ts) | Tag CRUD API |
| [src/api/settings.ts](file:///e:/AAAProject/VideoFileProcessing/src/api/settings.ts) | 设置读写 API |
| [src/core/runner.ts](file:///e:/AAAProject/VideoFileProcessing/src/core/runner.ts) | FlowRunner 执行引擎 |
| [src/core/flow.ts](file:///e:/AAAProject/VideoFileProcessing/src/core/flow.ts) | Flow/Edge 类型定义 |
| [src/core/context.ts](file:///e:/AAAProject/VideoFileProcessing/src/core/context.ts) | IFileContext 类型定义 |
| [src/core/node.ts](file:///e:/AAAProject/VideoFileProcessing/src/core/node.ts) | INode 及各节点配置类型 |
| [src/nodes/tagger.ts](file:///e:/AAAProject/VideoFileProcessing/src/nodes/tagger.ts) | TaggerNode 实现 |
| [src/nodes/mover.ts](file:///e:/AAAProject/VideoFileProcessing/src/nodes/mover.ts) | MoverNode 实现 |
| [src/factory/node-factory.ts](file:///e:/AAAProject/VideoFileProcessing/src/factory/node-factory.ts) | NodeFactory（JSON→实例） |
| [src/db/sqlite.ts](file:///e:/AAAProject/VideoFileProcessing/src/db/sqlite.ts) | SQLite 数据库管理 |
| [src/db/recovery.ts](file:///e:/AAAProject/VideoFileProcessing/src/db/recovery.ts) | 崩溃恢复管理器 |
| [src/utils/io.ts](file:///e:/AAAProject/VideoFileProcessing/src/utils/io.ts) | safeMoveFile + resolveTemplate |
| [src/utils/retry.ts](file:///e:/AAAProject/VideoFileProcessing/src/utils/retry.ts) | withRetry 重试机制 |
| [src/utils/queue.ts](file:///e:/AAAProject/VideoFileProcessing/src/utils/queue.ts) | PromiseQueue 并发队列 |
| [src/server.ts](file:///e:/AAAProject/VideoFileProcessing/src/server.ts) | Express + Socket.io 服务入口 |
| [web/src/App.tsx](file:///e:/AAAProject/VideoFileProcessing/web/src/App.tsx) | 前端主组件（状态管理） |
| [web/src/components/FileList.tsx](file:///e:/AAAProject/VideoFileProcessing/web/src/components/FileList.tsx) | 文件列表 + TagInput |
| [web/src/components/StatsDashboard.tsx](file:///e:/AAAProject/VideoFileProcessing/web/src/components/StatsDashboard.tsx) | 工作台统计面板 |
| [web/src/hooks/useSocket.ts](file:///e:/AAAProject/VideoFileProcessing/web/src/hooks/useSocket.ts) | Socket.io Hook |