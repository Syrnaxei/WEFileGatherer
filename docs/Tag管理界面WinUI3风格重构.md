# Tag 管理界面 WinUI3 风格重构

> 版本: 1.2.6 | 日期: 2026-05-22

## 重构目标

将 Tag 管理页面从旧有的卡片式网格布局重构为与设置页面（SettingsPage）一致的 WinUI3 风格，统一视觉语言和交互模式。

## 设计参考

以 `SettingsPage.tsx` 的 WinUI3 风格为基准：

- 使用 Fluent UI System Icons（`web/public/fluenticons/`）替代手绘 SVG 图标
- 采用 `.settings-tile` / `.settings-expandable-tile` / `.settings-sub-item` 等 CSS 组件类
- 所有颜色通过 CSS 变量引用（`var(--xxx)`），适配亮/暗双主题
- 遵循 4px 网格间距系统，150ms 缓动过渡

## 改动概览

### 1. 页面结构

| 区域 | 旧设计 | 新设计 |
|------|--------|--------|
| 页面背景 | `var(--bg-base)` 无差异化 | `var(--settings-page-bg)` 与设置页统一 |
| 页面头部 | 带 `border-bottom` 分隔线 | 纯色背景，与 SettingsPage 标题栏完全一致 |
| 新建 Tag 表单 | `.card` + `.card-header` 卡片容器 | `settings-expandable-tile` 可收起/展开行块 |
| Tag 列表 | CSS Grid 五列网格布局 | 每条 Tag 为独立 `.settings-tile` 行块 |
| 编辑模式 | 替换 grid 行内容为 input | `settings-expandable-tile expanded` 展开式编辑面板 |
| 空状态 | grid 内居中文字 | `settings-card-body` 内居中占位 |

### 2. 新建 Tag — 双模式交互

```
折叠状态（默认）:
┌──────────────────────────────────────────────────────────┐
│ [Fluent Tag Icon]  新建 Tag            [📁+ 添加文件夹] [▼] │
│                     点击"添加文件夹"选择目标目录            │
└──────────────────────────────────────────────────────────┘

展开状态:
┌──────────────────────────────────────────────────────────┐
│ [Fluent Tag Icon]  新建 Tag            [📁+ 添加文件夹] [▲] │
│                     点击"添加文件夹"选择目标目录            │
│  ──────────────────────────────────────────────────────  │
│  名称 *         [movie________________]                   │
│  文件夹路径 *   [D:/Videos/Movies______]                   │
│  描述           [可选_________________]                   │
│                                       [创建]              │
└──────────────────────────────────────────────────────────┘
```

**折叠状态行为**：点击「添加文件夹」→ 选择目录 → 自动以文件夹名创建 Tag，一步完成。创建失败时自动展开以便修正。

**展开状态行为**：点击「添加文件夹」→ 选择目录 → 填入「文件夹路径」子项 + 自动填充名称 → 手动点击「创建」确认。

### 3. 「添加文件夹」按钮设计

- 使用 Fluent UI `FolderAdd.svg` 图标（18px）+ 文字
- 专用 CSS 类 `.btn-folder-select`：`border: none`，背景/悬停色通过 CSS 变量驱动
- 暗色主题：背景 `#404040`，悬停 `#494949`
- 亮色主题：背景 `#D8D8D8`，悬停 `#CCCCCC`
- 垂直内边距 8px（较旧按钮 +2px），图标 18px（+2px），字号 13px（+1px）
- 位于卡片头部右侧，chevron 箭头之前
- 点击事件 `stopPropagation` 防止误触卡片展开/收起

### 4. 全局「选择...」按钮替换

项目中所有 `选择...` 文本按钮替换为 `FolderAdd.svg` 图标 + 文字按钮：

| 文件 | 位置 | 数量 |
|------|------|------|
| `SettingsPage.tsx` | 工作台源目录 / 搜刮源目录 / 搜刮导出目录 / FFmpeg bin 路径 | 4 |
| `TagManagement.tsx` | 编辑模式目标路径 | 1 |
| `PropertyPanel.tsx` | watchPath / targetPathTemplate（遗留组件） | 2 |

### 5. 图标系统

新增 `web/src/components/FluentIcons.tsx` — 共享 Fluent UI 图标组件：

| 组件 | 用途 | 来源 |
|------|------|------|
| `FluentTagIcon` | Tag 卡片/列表项图标 | `fluenticons/Tag.svg` |
| `FolderAddIcon` | 文件夹选择按钮图标 | `fluenticons/FolderAdd.svg` |

所有图标使用 `fill="currentColor"` 自动适配亮/暗主题。

### 6. CSS 变量新增

`web/src/index.css` 暗色主题：

```css
--btn-folder-bg: #404040;
--btn-folder-hover-bg: #494949;
```

亮色主题：

```css
--btn-folder-bg: #D8D8D8;
--btn-folder-hover-bg: #CCCCCC;
```

新增 CSS 类 `.btn-folder-select`（无边框填充按钮，圆角 6px，150ms 过渡）。

## 保留功能

以下功能完整保留，未作删减：

- Tag CRUD（创建 / 编辑 / 删除）
- 拖拽排序（`mousedown` / `mousemove` / `mouseup` 自定义实现 + `PUT /api/tags/reorder` 持久化）
- Tag 名称自动填充（`autoFillTagName` 设置项联动）
- 键盘快捷键（Enter 保存、Escape 取消编辑）
- Electron 原生目录选择对话框集成

## 涉及文件

| 文件 | 变更类型 |
|------|----------|
| `web/src/components/TagManagement.tsx` | 重写 — 页面结构与交互逻辑 |
| `web/src/components/SettingsPage.tsx` | 修改 — 替换 4 处「选择...」按钮 |
| `web/src/components/PropertyPanel.tsx` | 修改 — 替换 2 处「选择...」按钮 |
| `web/src/components/FluentIcons.tsx` | **新增** — Fluent UI 图标组件库 |
| `web/src/index.css` | 修改 — 新增 `--btn-folder-*` 变量和 `.btn-folder-select` 类 |
| `CLAUDE.md` | **新增** — 项目知识库文件 |
