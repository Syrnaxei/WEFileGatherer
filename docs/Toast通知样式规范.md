# Toast 通知样式规范 (WinUI 3 InfoBar 风格)

> **版本**: 1.0
> **组件文件**: `web/src/components/Toast.tsx`
> **样式文件**: `web/src/index.css`（末尾 Toast 区块）
> **设计参考**: WinUI 3 InfoBar + Fluent Design System
> **最后更新**: 2026-06-13

---

## 目录

1. [概述](#一概述)
2. [公开 API](#二公开-api)
3. [DOM 结构](#三dom-结构)
4. [CSS 类参考](#四css-类参考)
5. [动画规范](#五动画规范)
6. [类型与语义色映射](#六类型与语义色映射)
7. [主题适配](#七主题适配)
8. [布局与定位](#八布局与定位)
9. [使用示例](#九使用示例)

---

## 一、概述

Toast 通知组件是全局单例 —— 通过模块级函数引用模式，任意组件无需 prop 传递即可调用 `showToast()` 弹出通知。

**设计风格**: WinUI 3 InfoBar，特征为：
- 左侧 4px 强调色条（按类型着色）
- Fluent 描边风格 SVG 语义图标
- 8px 圆角卡片 + 系统阴影
- 弹性缩放入场动画（滑入 + 缩放 + 淡入）
- 退出动画（滑出 + 缩小 + 淡出）
- 右上角关闭按钮，支持手动提前关闭
- 自动消失（时长可配置，0–30 秒）

**类型**: `success`（成功）| `error`（错误）| `info`（信息）

---

## 二、公开 API

### `showToast(message, type?)`

从任意位置弹出通知。

```ts
import { showToast } from './components/Toast';

showToast('文件加载成功', 'success');
showToast('加载失败: 网络错误', 'error');
showToast('无匹配文件', 'info');  // type 默认 'info'
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `message` | `string` | 是 | — | 通知文本内容 |
| `type` | `ToastType` | 否 | `'info'` | `'success'` \| `'error'` \| `'info'` |

### `setToastDuration(seconds)`

设置通知自动消失时长。

```ts
import { setToastDuration } from './components/Toast';

setToastDuration(5);  // 5 秒后自动消失
setToastDuration(0);  // 不自动消失
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `seconds` | `number` | 秒数，传 0 禁用自动消失 |

**内部实现**: `toastDurationMs = seconds * 1000`。`addToast` 检测 `toastDurationMs <= 0` 时跳过 `setTimeout`，通知将一直显示直到用户手动关闭。

### `<Toast isDark />`

React 组件，在 App 根组件中渲染一次。

```tsx
<Toast isDark={isDark} />
```

| Props | 类型 | 说明 |
|-------|------|------|
| `isDark` | `boolean` | 保留以兼容现有调用，实际未使用（颜色由 CSS 变量处理） |

---

## 三、DOM 结构

单个 Toast 的渲染结构如下：

```html
<div class="toast-container">               <!-- 固定定位容器 -->
  <div class="toast-winui toast-success">   <!-- 卡片 + 类型变体（进入动画） -->
    <span class="toast-icon">               <!-- 16×16 SVG 语义图标 -->
      <svg>…</svg>
    </span>
    <span class="toast-message">            <!-- 消息文字 -->
      文件加载成功
    </span>
    <button class="toast-close" aria-label="关闭通知">  <!-- 关闭按钮 -->
      <svg>…</svg>
    </button>
  </div>
</div>
```

**退出态**: 关闭时先追加 `toast-exit` 类触发退出动画，220ms 后从 DOM 移除。

```
toast-winui toast-success  →  toast-winui toast-success toast-exit  →  removed
         (显示中)                    (播放退出动画)                    (DOM 移除)
```

---

## 四、CSS 类参考

所有颜色/间距/阴影均通过 `var(--xxx)` 引用，自动适配深色/浅色主题。无硬编码色值。

### 4.1 `.toast-container` — 容器

```css
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;   /* 容器本身不拦截点击，子项 pointer-events: auto */
}
```

### 4.2 `.toast-winui` — 卡片基础

```css
.toast-winui {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 8px 12px 12px;
  min-width: 280px;
  max-width: 420px;
  background: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);          /* 8px */
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
  position: relative;
  animation: toast-enter 300ms var(--ease-out);
}
```

### 4.3 `.toast-success` / `.toast-error` / `.toast-info` — 左侧强调色条

通过 `border-left: 4px solid` 实现，覆盖基础卡片的三边 1px 边框：

| 类名 | 强调色 | CSS 变量 |
|------|--------|----------|
| `.toast-success` | 绿色 | `var(--success)` |
| `.toast-error` | 红色 | `var(--error)` |
| `.toast-info` | 蓝色 | `var(--accent)` |

```css
.toast-success { border-left: 4px solid var(--success); }
.toast-error   { border-left: 4px solid var(--error); }
.toast-info    { border-left: 4px solid var(--accent); }
```

### 4.4 `.toast-exit` — 退出动画触发

```css
.toast-exit {
  animation: toast-exit 200ms var(--ease-out) forwards;
}
```

### 4.5 `.toast-icon` — 图标容器

```css
.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--accent);
}
.toast-success .toast-icon { color: var(--success); }
.toast-error   .toast-icon { color: var(--error); }
.toast-info    .toast-icon { color: var(--accent); }
```

内嵌 SVG 图标使用 `stroke="currentColor"`，颜色由父级 `.toast-icon` 的 `color` 控制。

### 4.6 `.toast-message` — 消息文字

```css
.toast-message {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  font-family: var(--font-ui);
  letter-spacing: -0.01em;
  line-height: 1.4;
}
```

### 4.7 `.toast-close` — 关闭按钮

```css
.toast-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: var(--radius-sm);          /* 6px */
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}
.toast-close:hover {
  background: var(--bg-surface-3);
  color: var(--text-primary);
}
```

---

## 五、动画规范

### 5.1 入场动画 `toast-enter`

组合动画：滑入 + 弹性缩放 + 淡入，模拟 WinUI 3 通知从屏幕边缘弹出的物理感。

| 属性 | 值 |
|------|-----|
| 时长 | `300ms` |
| 缓动 | `var(--ease-out)` = `cubic-bezier(0.16, 1, 0.3, 1)` |
| 起始 `transform` | `translateX(60px) scale(0.92)` |
| 起始 `opacity` | `0` |
| 终止 `transform` | `translateX(0) scale(1)` |
| 终止 `opacity` | `1` |

```css
@keyframes toast-enter {
  from {
    opacity: 0;
    transform: translateX(60px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
```

### 5.2 退出动画 `toast-exit`

| 属性 | 值 |
|------|-----|
| 时长 | `200ms` |
| 缓动 | `var(--ease-out)` = `cubic-bezier(0.16, 1, 0.3, 1)` |
| 起始 `transform` | `translateX(0) scale(1)` |
| 起始 `opacity` | `1` |
| 终止 `transform` | `translateX(40px) scale(0.95)` |
| 终止 `opacity` | `0` |
| 填充模式 | `forwards`（保留终止状态直到 DOM 移除） |

```css
@keyframes toast-exit {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(40px) scale(0.95);
  }
}
```

### 5.3 退出时序

```
removeToast(id) 调用
  ↓ 同步
setState: leaving = true           ← toast-exit 类追加，200ms 动画开始播放
  ↓ 220ms 后（略长于动画）
setState: filter out id            ← DOM 移除
```

---

## 六、类型与语义色映射

| 类型 | 强调色条 | 图标颜色 | SVG 图标 | 语义色变量 |
|------|----------|----------|----------|------------|
| `success` | 绿色 4px | `var(--success)` | 对勾 ✓ | `--success`（暗 `#6BBF6E` / 亮 `#107C10`） |
| `error` | 红色 4px | `var(--error)` | 叉号 ✗ | `--error`（暗 `#F1707B` / 亮 `#E81123`） |
| `info` | 蓝色 4px | `var(--accent)` | 圆圈 ⓘ | `--accent`（`#4CC2FF`） |

### SVG 图标规格

| 图标 | viewBox | 描边 | 特征 |
|------|---------|------|------|
| `SuccessIcon` | `0 0 16 16` | `strokeWidth: 1.6`, `strokeLinecap: round` | 左下到右上对勾路径 |
| `ErrorIcon` | `0 0 16 16` | `strokeWidth: 1.6`, `strokeLinecap: round` | 对角双线叉号 |
| `InfoIcon` | `0 0 16 16` | `strokeWidth: 1.5`, `strokeLinecap: round` | 圆圈 + 内部 i 竖线 |
| `CloseIcon` | `0 0 10 10` | `strokeWidth: 1.3`, `strokeLinecap: round` | 小号对角叉号 |

所有图标使用 `fill="none"` + `stroke="currentColor"`，颜色由 CSS 层控制，无需 JS 透传。

---

## 七、主题适配

Toast 组件不通过 `isDark` prop 做颜色判断。所有视觉属性由 CSS 变量自动切换：

| CSS 变量 | 暗色值 | 亮色值 | 影响 |
|----------|--------|--------|------|
| `--bg-surface-1` | `#202020` | `#FFFFFF` | 卡片背景 |
| `--border-default` | `#404040` | `#E0E0E0` | 卡片边框 |
| `--text-primary` | `#FFFFFF` | `#1A1A1A` | 消息文字 |
| `--text-muted` | `#7A7A7A` | `#999999` | 关闭按钮默认色 |
| `--bg-surface-3` | `#333333` | `#ECECEC` | 关闭按钮悬停背景 |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.6)` | `0 8px 24px rgba(0,0,0,0.10)` | 卡片阴影 |
| `--success` | `#6BBF6E` | `#107C10` | 成功强调色条 + 图标 |
| `--error` | `#F1707B` | `#E81123` | 错误强调色条 + 图标 |
| `--accent` | `#4CC2FF` | `#4CC2FF` | 信息强调色条 + 图标 |

---

## 八、布局与定位

```
┌────────────────────────────────────────────────── 视口 ──┐
│                                                          │
│                                                          │
│                                          ┌─────────────┐ │
│  ← 20px →                          ← 20px →  Toast 卡片  │ │
│                                          ├─────────────┤ │
│                                          │  ↑ 8px gap  │ │
│                                          ├─────────────┤ │
│                                          │  Toast 卡片  │ │
│                                          ├─────────────┤ │
│                                          │  ↑ 8px gap  │ │
│                                          ├─────────────┤ │
│                                          │  Toast 卡片  │ │
│                                          └─────────────┘ │
│                                              ↑ 20px      │
└──────────────────────────────────────────────────────────┘
```

| 属性 | 值 |
|------|-----|
| 定位方式 | `position: fixed` |
| 右下角距 | `bottom: 20px; right: 20px` |
| 层级 | `z-index: 9999` |
| 堆叠方向 | `flex-direction: column`（新通知出现在下方） |
| 卡片间距 | `gap: 8px` |
| 卡片最小宽度 | `280px` |
| 卡片最大宽度 | `420px` |
| 卡片内边距 | `12px 8px 12px 12px`（上 右 下 左） |
| 内容间距 | `gap: 10px`（图标 ↔ 文字 ↔ 关闭按钮） |

---

## 九、使用示例

### 9.1 基础用法

```tsx
import { showToast } from './components/Toast';

// 成功通知
showToast('文件处理完成', 'success');

// 错误通知
showToast('加载失败: 网络超时', 'error');

// 信息通知（type 可省略，默认 'info'）
showToast('无匹配文件');
showToast('正在扫描目录...', 'info');
```

### 9.2 配置自动消失时长

```tsx
import { setToastDuration } from './components/Toast';

// 设置页面持久化配置
const saveDuration = async (seconds: number) => {
  await fetch('/api/settings/toastDuration', {
    method: 'POST',
    body: JSON.stringify({ value: String(seconds) }),
  });
  setToastDuration(seconds);
};

// 0 = 不自动消失，需用户手动关闭
setToastDuration(0);
```

### 9.3 当前项目中的调用点

Toast 在以下文件中被调用（约 40 处），所有调用均无需修改：

| 文件 | 调用次数 | 典型场景 |
|------|----------|----------|
| `web/src/App.tsx` | ~30 | 文件加载成功/失败、处理开始/完成、冲突检测、校验失败 |
| `web/src/components/TagManagement.tsx` | ~20 | Tag 创建/更新/删除/排序的反馈 |
| `web/src/components/SettingsPage.tsx` | 1 | 通过 `setToastDuration` 配置通知时长 |

### 9.4 App 根组件挂载

```tsx
// web/src/App.tsx
import Toast from './components/Toast';

function App() {
  // ...
  return (
    <>
      <Toast isDark={isDark} />
      {/* ... other components ... */}
    </>
  );
}
```

`<Toast>` 只需挂载一次，内部通过 `useEffect` 将 `addToast` 注册到模块级变量 `addToastFn`，`showToast()` 调用该函数引用。卸载时自动清空引用。

---

## 附录: 架构说明

```
showToast(message, type)           ← 任意组件调用（模块级导出函数）
  ↓
addToastFn(message, type)          ← 模块级闭包变量，指向组件内部 addToast
  ↓
setState([...prev, {id, msg, type}])   ← 追加新 Toast 到数组
  ↓
setTimeout(() => removeToast(id), ms)  ← 自动消失定时器
  ↓
removeToast(id)                    ← 标记 leaving = true → 220ms 后 filter 移除
```

**关键设计决策**:
- **全局单例模式** — 避免每个页面单独渲染 Toast 容器，减少 DOM 冗余
- **退出动画两阶段** — 先标记 `leaving` 触发 CSS 动画，延迟 220ms（200ms 动画 + 20ms 缓冲）再移除 DOM
- **CSS 变量驱动** — 所有颜色通过 `var(--xxx)` 引用，深色/浅色主题切换时零 JS 参与
- **零破坏性** — 公开 API 签名不变，所有现有 ~40 处 `showToast()` 调用无需修改
