## User

该项目在最初的时候是以节点(node)运作的，但是在某次重构后抛弃了节点而采用了当前的流运作，帮我分析一下现在项目的运作与节点还有没有关系

## Assistant

这是一个很好的架构分析问题。让我深入代码给你做一个全面的分析。

---

## 结论：节点（Node）架构仍然是当前系统的核心骨架

虽然 UI 从"拖拽节点编辑器"变成了"批处理表格"，但**底层的节点执行引擎完全没有变**。现在的运作方式是 **"隐式节点"** ——节点被代码硬编码生成，而不是由用户在画布上拖拽创建。

---

## 证据链分析

### 1. 节点核心接口仍然完整保留

[node.ts](file:///e:/AAAProject/VideoFileProcessing/src/core/node.ts) 中定义了完整的节点类型系统：

```typescript
export enum NodeType {
  Watcher = 'watcher',
  Tagger = 'tagger',
  Mover = 'mover',
}

export interface INode<TConfig = unknown> {
  id: string;
  type: NodeType;
  config: TConfig;
  handle(ctx: IFileContext): Promise<IFileContext>;
}
```

三个节点类也全部存在：

- [WatcherNode](file:///e:/AAAProject/VideoFileProcessing/src/nodes/watcher.ts) — 文件监听
- [TaggerNode](file:///e:/AAAProject/VideoFileProcessing/src/nodes/tagger.ts) — 打标
- [MoverNode](file:///e:/AAAProject/VideoFileProcessing/src/nodes/mover.ts) — 移动

### 2. FlowRunner 仍然按节点链执行

[runner.ts](file:///e:/AAAProject/VideoFileProcessing/src/core/runner.ts#L50-L100) 的核心逻辑：

```typescript
private async executeSingle(initialCtx: IFileContext): Promise<IFileContext> {
  let ctx = initialCtx;
  let currentNodeId: string | undefined = this.entryNodeId;

  while (currentNodeId) {
    const node = this.nodeMap.get(currentNodeId);
    // ... 执行节点
    ctx = await node.handle(ctx);  // ← 调用节点的 handle 方法
    // ... 通过 adjacencyMap 找到下一个节点
    currentNodeId = nextIds[0];
  }
}
```

这仍然是经典的**节点链式执行模型**：`TaggerNode → MoverNode`

### 3. 节点工厂仍然在工作

[node-factory.ts](file:///e:/AAAProject/VideoFileProcessing/src/factory/node-factory.ts) 负责将 JSON 配置实例化为真实节点对象：

```typescript
static create(data: { id: string; type: string; config: unknown }): INode {
  switch (data.type) {
    case NodeType.Watcher: return new WatcherNode(...);
    case NodeType.Tagger:  return new TaggerNode(...);
    case NodeType.Mover:   return new MoverNode(...);
  }
}
```

### 4. 关键变化点：节点从"用户创建"变为"代码硬编码"

这是重构前后最大的区别：

| 维度            | 旧版（React Flow 画布）  | 新版（批处理表格）                          |
| ------------- | ------------------ | ---------------------------------- |
| **Flow 创建方式** | 用户在画布拖拽节点、连线       | 代码在 `POST /flows/:id/start` 中硬编码生成 |
| **节点配置**      | 用户在属性面板编辑          | 代码根据用户输入的 tag 动态填充                 |
| ** edges（边）** | 用户拖拽连线             | 代码写死：`tagger → mover`              |
| **可视化**       | React Flow 画布展示节点图 | 表格展示文件列表                           |

看 [flows.ts](file:///e:/AAAProject/VideoFileProcessing/src/api/flows.ts#L80-L110) 中的关键代码：

```typescript
const flow: IFlow = {
  id: flowId,
  name: 'Batch Processing',
  nodes: [
    NodeFactory.create({
      id: 'node-tagger',
      type: 'tagger',
      config: {
        rules: [{ type: 'user_tag', params: {} }],  // ← 读取 metadata.userTag
      },
    }),
    NodeFactory.create({
      id: 'node-mover',
      type: 'mover',
      config: {
        targetPathTemplate: '{metadata.targetPath}/{filename}',
      },
    }),
  ],
  edges: [
    { sourceId: 'node-tagger', targetId: 'node-mover' },  // ← 硬编码链
  ],
};
```

### 5. WatcherNode 实际上已被边缘化

注意新版代码中 **没有使用 WatcherNode**。旧版的流程是：

```
WatcherNode → TaggerNode → MoverNode
```

新版变成了：

```
用户点击"加载"扫描目录 → 用户分配 Tag → 点击"启动" → TaggerNode → MoverNode
```

WatcherNode 的"监听目录"功能被替换成了**用户手动加载 + API 扫描**。

---

## 架构关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      前端界面层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  工作区      │  │  Tag 管理    │  │      设置           │ │
│  │  (表格)      │  │  (CRUD)      │  │  (主题/版本)        │ │
│  └──────┬──────┘  └─────────────┘  └─────────────────────┘ │
│         │                                                   │
│         ▼  POST /api/scan  扫描目录                         │
│         ▼  POST /api/flows/:id/start  启动处理              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API 层 (flows.ts)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  硬编码创建 IFlow 对象                                  │  │
│  │  nodes: [TaggerNode, MoverNode]                        │  │
│  │  edges: [{tagger → mover}]                             │  │
│  └────────────────────┬──────────────────────────────────┘  │
│                       │  new FlowRunner(flow)               │
│                       ▼                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  FlowRunner.executeSingle()                           │  │
│  │    while (currentNodeId) {                            │  │
│  │      node.handle(ctx)  // TaggerNode → MoverNode      │  │
│  │    }                                                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 总结

| 问题                | 答案                                                 |
| ----------------- | -------------------------------------------------- |
| 节点架构还存在吗？         | **存在**，`INode` 接口、`NodeFactory`、`FlowRunner` 都完整保留 |
| 节点还在运行吗？          | **在运行**，每次点击"启动"都会创建 `TaggerNode → MoverNode` 链    |
| 用户还能看到节点吗？        | **不能**，React Flow 画布组件已废弃，节点变成隐式                   |
| WatcherNode 还在用吗？ | **不用了**，被"手动加载"替代                                  |
| 这是真正的重构还是 UI 换皮？  | **UI 换皮 + 简化工作流创建方式**，底层引擎未变                       |

**本质上说**：当前系统是一个**"预设工作流"**的节点引擎。节点链被写死在代码里，用户通过表格界面间接配置节点参数（tag → targetPath），而不是直接在画布上操作节点。
