# 滚动条样式规范指南

## 概述

本文档定义了项目中 Tag 下拉框组件滚动条的样式规范，确保所有开发者在添加类似滚动容器时保持视觉风格一致。

## 当前实现位置

| 文件 | 说明 |
|------|------|
| `web/src/index.css` | 全局滚动条样式定义（`.tag-dropdown-scroll`） |
| `web/src/components/FileList.tsx` | Tag 下拉框组件，使用 `className="tag-dropdown-scroll"` |

## CSS 规范

### WebKit 内核浏览器（Chrome / Edge / Electron）

```css
/* 垂直滚动条整体 */
.tag-dropdown-scroll::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

/* 水平滚动条整体（隐藏但保留功能，支持 Shift+滚轮） */
.tag-dropdown-scroll::-webkit-scrollbar-horizontal {
  height: 0;
}

/* 滚动条轨道（背景） */
.tag-dropdown-scroll::-webkit-scrollbar-track {
  background: transparent;
}

/* 滚动条滑块 */
.tag-dropdown-scroll::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

/* 滚动条滑块悬停状态 */
.tag-dropdown-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.8);
}

/* 滚动条角落（垂直+水平交汇处） */
.tag-dropdown-scroll::-webkit-scrollbar-corner {
  background: transparent;
}
```

### 尺寸速查表

| 属性 | 值 | 说明 |
|------|------|------|
| `width` | `4px` | 垂直滚动条宽度 |
| `height` | `4px` | 水平滚动条总高度（通用） |
| `height`（水平） | `0` | 水平滚动条高度（隐藏，功能保留） |
| `border-radius` | `2px` | 滑块圆角 |
| `track background` | `transparent` | 轨道背景透明 |

### 颜色速查表

| 属性 | 值 | 说明 |
|------|------|------|
| 滑块默认色 | `rgba(156, 163, 175, 0.5)` | 灰色半透明 |
| 滑块悬停色 | `rgba(156, 163, 175, 0.8)` | 悬停时加深 |
| 轨道背景 | `transparent` | 完全透明 |
| 角落背景 | `transparent` | 完全透明 |

## 实现细节

### 垂直滚动条

- **宽度**：`4px`，相比浏览器默认 `17px` 大幅收窄
- **轨道**：透明背景，不显示任何轨道痕迹
- **滑块**：半透明灰色圆角条，悬停时加深
- **视觉效果**：悬浮在内容之上的轻量滚动指示器

### 水平滚动条

- **高度**：设为 `0`，视觉上完全隐藏
- **功能保留**：`overflow-x: auto` 确保仍可通过 `Shift + 滚轮` 实现水平滚动
- **行为**：用户不会看到水平滚动条，但可以使用键盘/鼠标组合键横向滚动

### 滚动条角落

- 垂直与水平滚动条交汇处的正方形区域
- 背景设为 `transparent`，避免出现空白方块

## 使用方式

### 在现有组件中复用

```tsx
<div
  className="tag-dropdown-scroll"
  style={{
    maxHeight: '160px',
    overflowY: 'auto',
    overflowX: 'auto',
  }}
>
  {/* 内容 */}
</div>
```

### 为新组件创建样式

如果需要为新组件创建相同效果但不同类名的滚动条：

```css
.new-scroll-area::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.new-scroll-area::-webkit-scrollbar-horizontal {
  height: 0;
}

.new-scroll-area::-webkit-scrollbar-track {
  background: transparent;
}

.new-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.new-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.8);
}

.new-scroll-area::-webkit-scrollbar-corner {
  background: transparent;
}
```

### 抽离为全局通用类

如需在多个组件复用，可将 `.tag-dropdown-scroll` 重命名为语义更通用的类名（如 `.custom-scrollbar`），或添加第二个类名：

```css
/* 支持多个类名共用同一套滚动条样式 */
.tag-dropdown-scroll::-webkit-scrollbar,
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
```

## 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|----------|
| Chrome / Edge | ✅ 完全支持（`::-webkit-scrollbar`） |
| Electron (Chromium) | ✅ 完全支持 |
| Firefox | ⚠️ 需使用 `scrollbar-width: thin` + `scrollbar-color` |
| Safari | ✅ 完全支持（`::-webkit-scrollbar`） |

### Firefox 补充样式（可选）

```css
.tag-dropdown-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}
```

## 相关文件索引

- 全局样式定义：[`web/src/index.css`](../web/src/index.css)
- Tag 下拉框组件：[`web/src/components/FileList.tsx`](../web/src/components/FileList.tsx)
