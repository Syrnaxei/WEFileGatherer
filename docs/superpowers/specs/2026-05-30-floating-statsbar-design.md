# 浮动 WorkspaceStatsBar 设计方案

## 概述

将 WorkspaceStatsBar 改为浮动面板，使用毛玻璃质感和更大圆角，吸附在文件列表底部，提升视觉层次感和现代感。

## 设计参数

| 参数 | 值 |
|------|-----|
| 定位方式 | `position: sticky; bottom: 0`（在可滚动容器内） |
| 左右间距 | 面板自身 `margin: 0 20px`（继承页面 24px padding 后实际距边缘 24px） |
| 底部间距 | 由容器 padding-bottom 控制，面板上 margin 与下方间距协调 |
| 圆角 | `border-radius: 12px` |
| 背景 | `rgba(37,37,54,0.88)` + `backdrop-filter: blur(16px)` |
| 边框 | `1px solid rgba(255,255,255,0.1)` |
| 阴影 | `0 8px 32px rgba(0,0,0,0.35)` |
| 文件列表底部留白 | 容器 `padding-bottom: 16px`，面板与最后一张卡片间距由 `margin-top` 控制 |

## 架构

### 定位策略：sticky 而非 fixed

`position: sticky; bottom: 0` 在可滚动容器内即可达到"始终在底部可见"的效果，且无需处理侧边栏宽度计算，实现更简洁：

```
WorkspacePage / ScrapePage
├── PageHeader
└── Content Area (flex: 1, overflow: hidden, padding: 0 24px 24px)
    ├── FileList Scroll Container (flex: 1, overflow-y: auto)
    │   ├── Column Header
    │   ├── File Cards...
    │   └── WorkspaceStatsBar  ← position: sticky; bottom: 0
    └── LogTerminal (optional)
```

StatsBar 维持在 Page 组件内部，不提升到 App 层。sticky 定位使其在文件列表滚动时吸附在容器底部，视觉效果与 fixed 一致。

### WorkspaceStatsBar 组件改动

- 移除 `borderBottom`
- 背景改为 `rgba(37,37,54,0.88)` + `backdrop-filter: blur(16px)`
- 新增 `border-radius: 12px`
- 新增 `border: 1px solid rgba(255,255,255,0.1)`
- 新增 `box-shadow: 0 8px 32px rgba(0,0,0,0.35)`
- 新增 `position: sticky; bottom: 0` 和 `margin-top` 以与最后一张卡片保持间距
- 按钮容器和统计指标布局不变

### WorkspacePage / ScrapePage 改动

- StatsBar 从 PageHeader 下方移至文件列表可滚动容器内部（卡片列表之后）
- 可滚动容器增加适当 padding-bottom

## 数据流

无变化。StatsBar 仍通过 props 从 Page 组件接收数据，WorkspacePage 传 tagged，ScrapePage 不传。

## 影响范围

- `WorkspaceStatsBar.tsx` — 样式更新（玻璃质感 + sticky 定位）
- `WorkspacePage.tsx` — StatsBar 位置移动
- `ScrapePage.tsx` — StatsBar 位置移动
- 无 API 变更，无新增依赖

## 非功能性

- 无 API 变更
- 无新增依赖
- 三个 TypeScript 编译目标均需零错误通过
- `backdrop-filter` 在 Electron 中有良好支持（Chromium 120+）
