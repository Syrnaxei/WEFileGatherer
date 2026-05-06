# SVFP — 使用手册

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Windows / macOS / Linux

### 安装依赖

```bash
# 1. 克隆或解压项目
# 2. 安装后端依赖
npm install

# 3. 安装前端依赖
cd web && npm install
```

### 运行方式

#### 方式一：Electron 桌面端（推荐）

```bash
# 开发模式（带热重载）
npm run electron:dev

# 构建生产包
npm run electron:build
# 输出目录: release/
```

#### 方式二：Node.js 服务端 + 前端独立运行

```bash
# 终端 1：启动后端服务
npm run build
node dist/server.js
# 服务运行在 http://localhost:3000

# 终端 2：启动前端开发服务器
cd web && npm run dev
# 前端运行在 http://localhost:5173
```

#### 方式三：Node.js CLI 模式（无 GUI）

```bash
npm run build
npm start
# 读取 .env 配置，直接监听 input 目录
```

---

## 配置说明

### 环境变量 (.env)

```bash
# Watcher 配置
WATCH_PATH=./input              # 监听目录路径
FILE_PATTERN=*.mp4              # 文件匹配正则

# Mover 配置
OUTPUT_TEMPLATE=./output/{tag}/{filename}  # 目标路径模板
OVERWRITE=false                 # 是否覆盖已存在文件

# Runner 配置
CONCURRENCY=5                   # 并发处理数量限制
```

### 路径模板变量

在 MoverNode 的目标路径模板中，支持以下占位符：

| 变量 | 说明 | 示例 |
|------|------|------|
| `{filename}` | 当前文件名 | `video.mp4` |
| `{originalFilename}` | 原始文件名 | `video.mp4` |
| `{ext}` | 文件扩展名 | `.mp4` |
| `{tag}` | 第一个标签 | `PROCESSED_video.mp4` |
| `{tag[n]}` | 第 n 个标签（从 0 开始）| `{tag[0]}` |
| `{metadata.xxx}` | metadata 中的值 | `{metadata.detectedAt}` |
| `{YYYY}` | 当前年份 | `2026` |
| `{MM}` | 当前月份 | `05` |
| `{DD}` | 当前日期 | `05` |

---

## GUI 使用指南

### 界面概览

SVFP 采用左侧导航栏 + 右侧内容区的布局：

- **左侧边栏**：切换工作区 / Tag 管理 / 设置
- **顶部统计栏**：实时显示待处理/处理中/已完成/失败数量
- **主内容区**：根据当前页面显示不同内容
- **底部日志终端**：WebSocket 实时推送文件流转日志

### 1. 工作区（核心功能）

#### 加载视频文件

1. 在顶部输入框设置**源文件目录**（或点击"选择文件夹"按钮）
2. 点击**"加载"**按钮，系统扫描目录下的视频文件
3. 文件列表显示文件名、大小、修改时间

#### 分配 Tag

1. 在文件列表的**Tag 输入框**中输入 Tag 名称
2. 支持输入已有 Tag（自动联想）或新建 Tag
3. 每个文件只能分配一个 Tag
4. Tag 决定文件将被移动到哪个目标路径

#### 启动工作流

1. 确认所有文件已分配 Tag
2. 点击顶部**"启动"**按钮
3. 系统开始按 Tag 将文件移动到对应目标路径
4. 实时日志终端显示处理进度

#### 移除文件

- 点击文件行右侧的**"移除"**按钮，将该文件从列表中移除（不会删除实际文件）

### 2. Tag 管理

#### 创建 Tag

1. 进入**Tag 管理**页面
2. 在顶部表单填写：
   - **名称**（必填）：Tag 的唯一标识，如 `movie`
   - **目标路径**（必填）：文件将被移动到此目录，支持点击"选择..."按钮浏览文件夹
   - **描述**（可选）：Tag 的说明文字
3. 点击**"创建"**按钮

#### 编辑 Tag

1. 在 Tag 列表中找到要修改的 Tag
2. 点击**"编辑"**按钮，进入编辑模式
3. 修改名称、目标路径或描述
4. 点击**"保存"**确认，或**"取消"**放弃修改

#### 删除 Tag

1. 在 Tag 列表中找到要删除的 Tag
2. 点击**"删除"**按钮
3. 确认删除操作

> **注意**：删除 Tag 不会影响已处理的历史文件，但会影响当前工作区中使用了该 Tag 的文件。

### 3. 设置

#### 外观设置

- **夜间模式**：切换亮色/暗色主题，偏好自动保存到数据库

#### 关于

- **应用名称**：SVFP
- **版本号**：当前安装的版本
- **构建日期**：当前版本的构建时间

---

## CLI 使用指南

### 直接运行

```bash
# 1. 配置 .env 文件
# 2. 确保 input/ 目录存在
# 3. 运行
npm start
```

### 观察日志输出

```
[WatcherNode] Started watching: E:\...\input
[WatcherNode] File pattern: *.mp4
[main] Flow is running. Watching for new files...

[WatcherNode] Detected file ready: E:\...\input\2024-01-01-video.mp4
[main] New file detected, enqueuing traceId=1714903456789-abc123: E:\...\input\2024-01-01-video.mp4
[FlowRunner] -> watcher(node-watcher) traceId=1714903456789-abc123
[FlowRunner] ✓ watcher(node-watcher) completed traceId=1714903456789-abc123
[FlowRunner] -> tagger(node-tagger) traceId=1714903456789-abc123
[TaggerNode] Added tag: "550e8400-e29b-41d4-a716-446655440000"
[TaggerNode] Added tag: "2024-01-01"
[TaggerNode] Added tag: "PROCESSED_2024-01-01-video.mp4"
[FlowRunner] ✓ tagger(node-tagger) completed traceId=1714903456789-abc123
[FlowRunner] -> mover(node-mover) traceId=1714903456789-abc123
[MoverNode] Renamed (atomic): E:\...\input\2024-01-01-video.mp4 -> E:\...\output\2024-01-01\video.mp4
[FlowRunner] ✓ mover(node-mover) completed traceId=1714903456789-abc123
[FlowRunner] ✓ Flow completed traceId=1714903456789-abc123
```

### 优雅退出

按 `Ctrl+C` 触发 SIGINT：
- WatcherNode 停止监听
- 已入队的文件继续处理（约 1 秒等待）
- 应用正常退出

---

## 崩溃恢复

### 自动检测

应用启动时自动检查 SQLite 中未完成的记录：

1. **PENDING 状态**：文件进入队列但尚未开始处理
   - 自动重新入队，继续处理
2. **RUNNING 状态**：文件在某个节点执行时崩溃
   - 生成告警提示，建议人工检查文件状态
   - 控制台输出警告信息

### 手动恢复

如需查看未完成的记录：

```bash
# 使用 SQLite CLI
sqlite3 data/vfp.db "SELECT * FROM tbl_context_history WHERE status IN ('PENDING', 'RUNNING');"
```

---

## 常见问题

### Q1: WatcherNode 没有检测到文件？

- 检查 `WATCH_PATH` 是否正确
- 检查 `FILE_PATTERN` 是否匹配文件名（如 `*.mp4`）
- 检查文件是否已完全写入（大文件拷贝需要时间）
- WatcherNode 使用 `awaitWriteFinish`（2000ms 稳定阈值），请等待文件写入完成

### Q2: MoverNode 移动失败？

- 检查目标路径模板是否正确
- 检查是否有写入权限
- 检查磁盘空间是否充足
- 检查文件是否被其他程序占用
- MoverNode 会自动重试 3 次（指数退避），可在日志中观察重试过程

### Q3: 跨磁盘移动很慢？

- 这是正常现象。`fs.rename` 无法跨盘，系统会自动降级为 `copyFile + unlink`
- 大文件跨盘移动需要等待拷贝完成

### Q4: 如何清除历史记录？

```bash
# 删除 SQLite 数据库文件
rm data/vfp.db
# 重启应用后会自动重建表结构
```

### Q5: Electron 模式下前端白屏？

- 确保前端已构建：`cd web && npm run build`
- 检查控制台错误：开发模式下按 `F12` 或 `Ctrl+Shift+I` 打开 DevTools
- 检查后端服务是否正常启动（Express 端口 3000）

### Q6: 如何修改并发数？

编辑 `.env` 文件：
```bash
CONCURRENCY=10  # 根据系统 IO 能力调整
```

### Q7: 源文件目录重启后恢复默认？

此问题已在 V1.1 修复。源文件目录现在通过 `tbl_settings` 表持久化，重启后自动恢复上次设置。

### Q8: Tag 输入框无法输入？

此问题已在 V1.1 修复。原生 `alert()` 被替换为自定义 Toast 通知组件，不再导致窗口失焦。

---

## API 接口参考

### REST API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/flows` | 获取所有工作流 |
| POST | `/api/flows` | 保存/更新工作流 |
| POST | `/api/flows/:id/start` | 启动指定工作流 |
| POST | `/api/flows/:id/stop` | 停止指定工作流 |
| GET | `/api/tags` | 获取所有 Tag |
| GET | `/api/tags/:id` | 获取指定 Tag |
| POST | `/api/tags` | 创建 Tag |
| PUT | `/api/tags/:id` | 更新 Tag |
| DELETE | `/api/tags/:id` | 删除 Tag |
| GET | `/api/settings/:key` | 获取设置项 |
| POST | `/api/settings/:key` | 设置设置项 |

### WebSocket 事件

**客户端 -> 服务端：**
- `subscribe` (flowId: string) — 订阅指定工作流的日志

**服务端 -> 客户端：**
- `log` — 实时推送日志事件
  ```typescript
  {
    event: 'enqueue' | 'node_start' | 'node_complete' | 'flow_complete' | 'error',
    nodeId?: string,
    nodeType?: string,
    error?: string,
    ctx: IFileContext
  }
  ```

### IPC 接口（Electron）

| Channel | 方向 | 参数 | 返回值 |
|---------|------|------|--------|
| `dialog:openDirectory` | Renderer -> Main | 无 | string \| null（文件夹路径）|
| `db:getStats` | Renderer -> Main | flowId?: string | Record<status, number> |
| `db:getErrors` | Renderer -> Main | flowId?: string | ErrorRecord[] |
| `db:discard` | Renderer -> Main | traceId: string | { success: boolean } |
| `recovery:check` | Renderer -> Main | 无 | RecoveryReport |

---

## 开发指南

### 添加新节点类型

1. **定义配置接口**（`src/core/node.ts`）：
```typescript
export interface ICustomNodeConfig {
  // 自定义配置字段
}
```

2. **实现节点类**（`src/nodes/custom.ts`）：
```typescript
export class CustomNode implements INode<ICustomNodeConfig> {
  id: string;
  type = NodeType.Custom; // 添加枚举值
  config: ICustomNodeConfig;

  constructor(id: string, config: ICustomNodeConfig) {
    this.id = id;
    this.config = config;
  }

  async handle(ctx: IFileContext): Promise<IFileContext> {
    // 实现处理逻辑
    return ctx;
  }
}
```

3. **注册到 NodeFactory**（`src/factory/node-factory.ts`）：
```typescript
case NodeType.Custom:
  return new CustomNode(data.id, data.config as ICustomNodeConfig);
```

4. **添加前端组件**（`web/src/components/nodes/CustomNode.tsx`）

5. **注册到 FlowCanvas**（`web/src/components/FlowCanvas.tsx`）：
```typescript
const nodeTypes = {
  // ...existing types
  custom: CustomNodeCard,
};
```

### 修改 Checkpoint 状态机

编辑 `src/db/sqlite.ts`：
1. 在 `ContextStatus` 枚举中添加新状态
2. 在 `FlowRunner` 中相应位置调用 `db.upsertContext()`
3. 在 `RecoveryManager` 中处理新状态的恢复逻辑

---

## 性能优化建议

1. **并发数调整**：根据磁盘 IO 能力设置 `CONCURRENCY`
   - SSD: 5-10
   - HDD: 2-3
   - 网络驱动器: 1-2

2. **Watcher 防抖**：大文件拷贝场景下，增加 `stabilityThreshold`
   ```typescript
   awaitWriteFinish: {
     stabilityThreshold: 5000,  // 5秒稳定阈值
     pollInterval: 500,
   }
   ```

3. **数据库 WAL 模式**：已默认启用 `journal_mode = WAL`，支持读写并发

4. **模板缓存**：频繁使用的路径模板可预编译正则表达式

---

## 构建与发布

### 类型检查

```bash
# 检查所有 TypeScript 代码
npx tsc --noEmit
npx tsc -p tsconfig.electron.json --noEmit
cd web && npx tsc --noEmit
```

### 构建前端

```bash
cd web && npm run build
```

### 构建 Electron 后端

```bash
npx tsc -p tsconfig.electron.json
```

### 打包发布

```bash
npm run electron:build
# 输出目录: release/
```

> **注意**：Windows 非管理员环境下 `winCodeSign` 下载可能失败，但生成的 exe 仍然可用。

---

*文档版本: V1.1 | 最后更新: 2026-05-06*
