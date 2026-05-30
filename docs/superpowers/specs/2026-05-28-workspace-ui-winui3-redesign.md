# 工作台 UI WinUI3 风格重构设计

**日期**: 2026-05-28
**状态**: 设计确认，待实现

## 概述

将工作台页面从 App.tsx 内联 JSX 提取为独立的 `WorkspacePage.tsx` 组件，全面应用 WinUI3 组件框架，提升视觉一致性和可维护性。

## 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `web/src/components/WorkspacePage.tsx` | 工作台页面主组件 |
| 新建 | `web/src/components/winui/WorkspaceStatsBar.tsx` | 融合统计摘要栏（含操作按钮） |
| 修改 | `web/src/App.tsx` | 删除内联 workspace JSX，改为 `<WorkspacePage .../>` 透传 |
| 修改 | `web/src/App.tsx` | 删除 `fileListViewMode` 相关状态和设置（列表模式已弃用） |
| 重构 | `web/src/components/FileList.tsx` | WinUI3 卡片式行块重构，移除 ListView |
| 补充 | `web/src/components/winui/index.ts` | 导出 WorkspaceStatsBar |
| 补充 | `web/src/components/SettingsIcons.tsx` (或 FulentIcons.tsx) | 新增 FolderPlus 图标（加载按钮用） |

## 页面结构

```
WorkspacePage
├── PageHeader (WinUI)          # 标题 + 源目录路径描述
├── WorkspaceStatsBar (WinUI)   # 统计指标 + 图标操作按钮
│   ├── 左侧: 待处理数量 | 已标记 | 已处理 | 失败 | 总计
│   ├── 分隔线
│   └── 右侧: [FolderPlus]加载 [▶]启动 [■]停止
├── 文件列表表头                # Flex 布局
└── FileList (缩略图模式)       # WinUI3 卡片式行块
    ├── 预览(72px) | 文件名(1fr) | Tag(130px) | 间距(28px) | 目标路径(180px) | 状态(90px) | 操作(32px)
    └── LogTerminal              # 不变
```

## WorkspacePage Props 接口

```tsx
interface WorkspacePageProps {
  files: FileItem[];
  onLoad: () => Promise<void>;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onTagChange: (index: number, tag: string) => void;
  onRemove: (index: number) => void;
  savedTags: SavedTag[];
  getTargetPathForTag: (tagName: string) => string;
  wfpPath: string;
  isRunning: boolean;
  processedCount: number;
  failedCount: number;
  showFullPath: boolean;
  thumbnailCount: number;
  showLogTerminal: boolean;
  ffmpegAvailable: boolean;
  logs: LogEntry[];
  connected: boolean;
  debugLogEnabled: boolean;
  isDark: boolean;
  // 删除: viewMode (列表模式已弃用)
}
```

## WorkspaceStatsBar 组件

```tsx
interface WorkspaceStatsBarProps {
  total: number;
  tagged: number;
  processed: number;
  failed: number;
  isRunning: boolean;
  onLoad: () => void;
  onStart: () => void;
  onStop: () => void;
}
```

- 背景 `var(--settings-tile-bg)` (#323232)
- 待处理数量大号 accent mono 数字 + "个文件待处理" 描述
- 竖线分隔
- 统计指标（已标记/已处理/失败/总计）以 mono 字体 + 语义色加粗显示
- 操作按钮组（36x36 图标按钮，透明底 + 语义色图标，hover 显示 muted 背景）
  - 加载: FolderPlus 图标 (#4CC2FF)
  - 启动: 播放三角 (#6BBF6E)，运行中禁用
  - 停止: 方块 (#F1707B)，未运行时禁用

## FileList WinUI3 卡片式行块

每行独立卡片：`border-radius: 8px`，`border: 1px solid var(--border-subtle)`，行间距 8px

### 列布局 (Flex)

```
| 预览(72px) | 文件名(flex:1) | Tag(130px) | spacer(28px) | 目标路径(180px) | 状态(90px) | 操作(32px) |
```

### 文件名列
- 文件名 14px 500
- 元数据行 11px mono muted，文件大小用 accent 高亮

### Tag Chip
- 已标记: 灰色圆点 + 名称 + 实线边框 + bg-surface-2 背景
- 未标记: 虚线边框 "+ 选择 tag" 占位
- 点击 Chip 弹出下拉选择器（保留现有 TagInput 逻辑）

### 目标路径列
- Fluent Folder.svg 图标 (14px, #7A7A7A) + mono 文字
- 统一 muted 灰色，不跟随状态色
- 未标记时显示 "-"
- 溢出省略

### 状态提示
- 缩略图左下角状态圆点 (8px, 带 box-shadow 辉光)
- 右侧状态文字标签

### 行背景与状态
- 待处理: `bg-surface-1`, 状态文字 muted
- 未标记: `bg-surface-1`, 状态文字 warning
- 处理中: `accent-muted` 背景 + `accent` 边框 + 缩略图 accent 发光 + 不确定进度条
- 完成: `bg-surface-1`, 透明度 0.8, 缩略图绿色圆点, 状态文字 success
- 失败: `bg-surface-1`, 缩略图红色圆点, 状态文字 error

### 删除按钮
- WinUI ActionButton/DeleteIcon 样式
- 默认透明，hover error-muted 背景 + error 图标色
- 运行中禁用

## API 不受影响

所有 fetch() 调用仍在 App.tsx 中定义，通过 props 传入 WorkspacePage。零 API 变更。
Socket.io 通信、useSocket hook 保持不变。

## 不变项

- LogTerminal 组件
- ScrapePage 组件（后续迁移）
- SettingsPage 组件
- TagManagement 组件
- 后端所有 API 路由
- 全局 CSS 变量和设计系统

## 移除项

- 列表视图模式 (ListView / ViewMode) — 已弃用
- fileListViewMode 状态和相关设置 API 调用
- App.tsx 中内联 workspace JSX
- StatsDashboard 组件（被 WorkspaceStatsBar 替代）
