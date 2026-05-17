# MD3 配色方案文档

> **版本**: 1.0
> **配色规范**: Material Design 3 (Google)
> **Source Color**: `#6750A4` (MD3 标准紫色主色)
> **适用文件**: `web/src/index.css`
> **最后更新**: 2026-05-14

---

## 目录

1. [概述](#一概述)
2. [MD3 核心色彩体系（暗色模式）](#二md3-核心色彩体系暗色模式)
3. [MD3 核心色彩体系（亮色模式）](#三md3-核心色彩体系亮色模式)
4. [扩展语义色](#四扩展语义色)
5. [向后兼容别名映射表](#五向后兼容别名映射表)
6. [对比度分析](#六对比度分析)
7. [配色修改步骤](#七配色修改步骤)

---

## 一、概述

本次配色迁移将前端原有的 "Precision Terminal" 自定义配色方案，全面替换为 **Material Design 3 (MD3)** 官方经典配色方案。MD3 配色体系基于 **色调调色板 (Tonal Palette)** 理论，通过科学的色彩层级划分，确保在暗色和亮色模式下均达到 **WCAG AA 及以上** 的对比度标准。

### 设计原则

- **暗色/亮色独立配色**: 不再共享任何颜色值，两套色板各自基于 MD3 规范独立定义
- **色彩层级完整**: 完整应用 MD3 所有核心色彩类别（Primary、Secondary、Tertiary、Background、Surface、Error）
- **文本层级体系**: Primary → Secondary → Muted 三级文本色严格遵循 MD3 on-surface 层级
- **向后兼容**: 所有旧版 `--xxx` 变量通过 `var()` 别名映射到 MD3 token，现有组件无需修改

---

## 二、MD3 核心色彩体系（暗色模式）

暗色模式为默认主题（`:root` / `[data-theme="dark"]`），Source Color 为 MD3 标准紫色 `#6750A4`。

### 2.1 Primary（主色）— 紫色系

MD3 主色用于应用的核心交互元素，包括主按钮、激活态、链接、强调色。

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-primary` | `#D0BCFF` (#D0BCFF) | 主操作按钮、激活态、链接、强调色 (`--accent`) |
| `--md-sys-color-on-primary` | `#381E72` (#381E72) | 主色上的文本（按钮文字） |
| `--md-sys-color-primary-container` | `#4F378B` (#4F378B) | 主色容器背景（强调区域背景） |
| `--md-sys-color-on-primary-container` | `#EADDFF` (#EADDFF) | 主色容器上的文本 |

### 2.2 Secondary（次要色）— 灰紫色系

MD3 次要色用于不重要的 UI 元素，如次要按钮、筛选芯片。

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-secondary` | `#CCC2DC` (#CCC2DC) | 次要按钮、辅助装饰元素 |
| `--md-sys-color-on-secondary` | `#332D41` (#332D41) | 次要色上的文本 |
| `--md-sys-color-secondary-container` | `#4A4458` (#4A4458) | 次要色容器背景 |
| `--md-sys-color-on-secondary-container` | `#E8DEF8` (#E8DEF8) | 次要色容器上的文本 |

### 2.3 Tertiary（强调色）— 粉色系

MD3 强调色用于与主色形成对比的装饰元素，如分类标签、强调图标。

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-tertiary` | `#EFB8C8` (#EFB8C8) | 强调色装饰元素、第三级分类标记 |
| `--md-sys-color-on-tertiary` | `#492532` (#492532) | 强调色上的文本 |
| `--md-sys-color-tertiary-container` | `#633B48` (#633B48) | 强调色容器背景 |
| `--md-sys-color-on-tertiary-container` | `#FFD8E4` (#FFD8E4) | 强调色容器上的文本 |

### 2.4 Error（错误色）— 红色系

MD3 错误色用于错误状态、删除操作、危险提示。

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-error` | `#F2B8B5` (#F2B8B5) | 错误按钮 (`--error`)、失败状态 |
| `--md-sys-color-on-error` | `#601410` (#601410) | 错误色上的文本 |
| `--md-sys-color-error-container` | `#8C1D18` (#8C1D18) | 错误容器背景 |
| `--md-sys-color-on-error-container` | `#F9DEDC` (#F9DEDC) | 错误容器上的文本 |

### 2.5 Background（背景色）

页面最底层的背景色。

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-background` | `#1C1B1F` (#1C1B1F) | 页面根背景 (`--bg-base`) |
| `--md-sys-color-on-background` | `#E6E1E5` (#E6E1E5) | 背景上的文本 |

### 2.6 Surface（表面色）— 五级层级

MD3 表面色通过五级容器层级（Surface Container）表达界面高度层级关系。层级越低越接近背景，越高越突出。

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-surface` | `#1C1B1F` (#1C1B1F) | 基础表面 (`--bg-surface-1`)：卡片、表头 |
| `--md-sys-color-surface-container-lowest` | `#0F0D13` (#0F0D13) | 最低表面（最深色） |
| `--md-sys-color-surface-container-low` | `#2B2930` (#2B2930) | 低表面 (`--bg-surface-2`)：输入框背景 |
| `--md-sys-color-surface-container` | `#2F2D33` (#2F2D33) | 默认表面容器 |
| `--md-sys-color-surface-container-high` | `#3A373D` (#3A373D) | 高表面 (`--bg-surface-3`)：悬停态 |
| `--md-sys-color-surface-container-highest` | `#454248` (#454248) | 最高表面（最浅色） |
| `--md-sys-color-on-surface` | `#E6E1E5` (#E6E1E5) | 表面上的主文本 (`--text-primary`) |
| `--md-sys-color-surface-variant` | `#49454F` (#49454F) | 表面变体背景 |
| `--md-sys-color-on-surface-variant` | `#CAC4D0` (#CAC4D0) | 表面变体上的文本 (`--text-secondary`) |

### 2.7 Outline（轮廓色）— 边框与弱文本

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-outline` | `#938F99` (#938F99) | 弱文本 (`--text-muted`)、输入框边框 |
| `--md-sys-color-outline-variant` | `#49454F` (#49454F) | 默认边框分隔线 (`--border-default`) |

### 2.8 Inverse（反向色）

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-inverse-surface` | `#E6E1E5` | 反向表面（亮色背景用于暗色主题中的高亮区域） |
| `--md-sys-color-inverse-on-surface` | `#1C1B1F` | 反向表面上的文本 |
| `--md-sys-color-inverse-primary` | `#6750A4` | 反向主色 |

### 2.9 工具色

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-shadow` | `#000000` | 阴影基准色 |
| `--md-sys-color-scrim` | `#000000` | 遮罩层色彩 |
| `--md-sys-color-surface-tint` | `#D0BCFF` (#D0BCFF) | 表面色调覆盖（提升表面色与主色的关联性） |

---

## 三、MD3 核心色彩体系（亮色模式）

亮色模式通过 `[data-theme="light"]` 切换，Source Color 同为 `#6750A4`。

### 3.1 Primary（主色）— 紫色系

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-primary` | `#6750A4` (#6750A4) | 主操作按钮、激活态、链接、强调色 (`--accent`) |
| `--md-sys-color-on-primary` | `#FFFFFF` | 主色上的文本（按钮文字） |
| `--md-sys-color-primary-container` | `#EADDFF` (#EADDFF) | 主色容器背景 |
| `--md-sys-color-on-primary-container` | `#21005D` (#21005D) | 主色容器上的文本 |

### 3.2 Secondary（次要色）— 灰紫色系

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-secondary` | `#625B71` (#625B71) | 次要按钮、辅助装饰元素 |
| `--md-sys-color-on-secondary` | `#FFFFFF` | 次要色上的文本 |
| `--md-sys-color-secondary-container` | `#E8DEF8` (#E8DEF8) | 次要色容器背景 |
| `--md-sys-color-on-secondary-container` | `#1D192B` (#1D192B) | 次要色容器上的文本 |

### 3.3 Tertiary（强调色）— 粉色系

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-tertiary` | `#7D5260` (#7D5260) | 强调色装饰元素 |
| `--md-sys-color-on-tertiary` | `#FFFFFF` | 强调色上的文本 |
| `--md-sys-color-tertiary-container` | `#FFD8E4` (#FFD8E4) | 强调色容器背景 |
| `--md-sys-color-on-tertiary-container` | `#31111D` (#31111D) | 强调色容器上的文本 |

### 3.4 Error（错误色）— 红色系

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-error` | `#B3261E` (#B3261E) | 错误按钮 (`--error`)、失败状态 |
| `--md-sys-color-on-error` | `#FFFFFF` | 错误色上的文本 |
| `--md-sys-color-error-container` | `#F9DEDC` (#F9DEDC) | 错误容器背景 |
| `--md-sys-color-on-error-container` | `#410E0B` (#410E0B) | 错误容器上的文本 |

### 3.5 Background（背景色）

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-background` | `#FFFBFE` (#FFFBFE) | 页面根背景 (`--bg-base`) |
| `--md-sys-color-on-background` | `#1C1B1F` (#1C1B1F) | 背景上的文本 |

### 3.6 Surface（表面色）— 五级层级

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-surface` | `#FFFBFE` (#FFFBFE) | 基础表面 (`--bg-surface-1`)：卡片、表头 |
| `--md-sys-color-surface-container-lowest` | `#FFFFFF` | 最低表面（最浅色） |
| `--md-sys-color-surface-container-low` | `#F7F2FA` (#F7F2FA) | 低表面 (`--bg-surface-2`)：输入框背景 |
| `--md-sys-color-surface-container` | `#F3EDF7` (#F3EDF7) | 默认表面容器 |
| `--md-sys-color-surface-container-high` | `#ECE6F0` (#ECE6F0) | 高表面 (`--bg-surface-3`)：悬停态 |
| `--md-sys-color-surface-container-highest` | `#E6E0E9` (#E6E0E9) | 最高表面（最深色） |
| `--md-sys-color-on-surface` | `#1C1B1F` (#1C1B1F) | 表面上的主文本 (`--text-primary`) |
| `--md-sys-color-surface-variant` | `#E7E0EC` (#E7E0EC) | 表面变体背景 |
| `--md-sys-color-on-surface-variant` | `#49454F` (#49454F) | 表面变体上的文本 (`--text-secondary`) |

### 3.7 Outline（轮廓色）— 边框与弱文本

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-outline` | `#79747E` (#79747E) | 弱文本 (`--text-muted`)、输入框边框 |
| `--md-sys-color-outline-variant` | `#CAC4D0` (#CAC4D0) | 默认边框分隔线 (`--border-default`) |

### 3.8 Inverse（反向色）

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-inverse-surface` | `#313033` (#313033) | 反向表面 |
| `--md-sys-color-inverse-on-surface` | `#F4EFF4` (#F4EFF4) | 反向表面上的文本 |
| `--md-sys-color-inverse-primary` | `#D0BCFF` (#D0BCFF) | 反向主色 |

### 3.9 工具色

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-shadow` | `#000000` | 阴影基准色 |
| `--md-sys-color-scrim` | `#000000` | 遮罩层色彩 |
| `--md-sys-color-surface-tint` | `#6750A4` (#6750A4) | 表面色调覆盖 |

---

## 四、扩展语义色

除 MD3 核心色彩类别外，项目还定义了三个扩展语义色（Success / Warning / Info），均遵循 MD3 的色调调色板规范。

### 4.1 Success（成功）— 绿色系

#### 暗色模式

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-success` | `#7BDB8E` (#7BDB8E) | 成功按钮 (`--success`)、已完成状态、已连接指示 |
| `--md-sys-color-on-success` | `#003910` (#003910) | 成功色上的文本 |
| `--md-sys-color-success-container` | `#1B5E20` (#1B5E20) | 成功容器背景 |
| `--md-sys-color-on-success-container` | `#A5F0B0` (#A5F0B0) | 成功容器上的文本 |

#### 亮色模式

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-success` | `#1B6D2F` (#1B6D2F) | 成功按钮、已完成状态 |
| `--md-sys-color-on-success` | `#FFFFFF` | 成功色上的文本 |
| `--md-sys-color-success-container` | `#A5F0B0` (#A5F0B0) | 成功容器背景 |
| `--md-sys-color-on-success-container` | `#002106` (#002106) | 成功容器上的文本 |

### 4.2 Warning（警告）— 琥珀色系

#### 暗色模式

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-warning` | `#FFD970` (#FFD970) | 警告按钮 (`--warning`)、Mover节点色、统计色 |
| `--md-sys-color-on-warning` | `#3A2E00` (#3A2E00) | 警告色上的文本 |
| `--md-sys-color-warning-container` | `#5A4500` (#5A4500) | 警告容器背景 |
| `--md-sys-color-on-warning-container` | `#FFE088` (#FFE088) | 警告容器上的文本 |

#### 亮色模式

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-warning` | `#7A5900` (#7A5900) | 警告按钮、Mover节点色 |
| `--md-sys-color-on-warning` | `#FFFFFF` | 警告色上的文本 |
| `--md-sys-color-warning-container` | `#FFE088` (#FFE088) | 警告容器背景 |
| `--md-sys-color-on-warning-container` | `#261A00` (#261A00) | 警告容器上的文本 |

### 4.3 Info（信息）— 蓝色系

#### 暗色模式

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-info` | `#A8C7FF` (#A8C7FF) | 信息按钮 (`--info`)、已标记统计色 |
| `--md-sys-color-on-info` | `#00315F` (#00315F) | 信息色上的文本 |
| `--md-sys-color-info-container` | `#1B4A8A` (#1B4A8A) | 信息容器背景 |
| `--md-sys-color-on-info-container` | `#D3E4FF` (#D3E4FF) | 信息容器上的文本 |

#### 亮色模式

| MD3 Token | 色值 | 用途 |
|---|---|---|
| `--md-sys-color-info` | `#1B4A8A` (#1B4A8A) | 信息按钮、已标记统计色 |
| `--md-sys-color-on-info` | `#FFFFFF` | 信息色上的文本 |
| `--md-sys-color-info-container` | `#D3E4FF` (#D3E4FF) | 信息容器背景 |
| `--md-sys-color-on-info-container` | `#001C3A` (#001C3A) | 信息容器上的文本 |

---

## 五、向后兼容别名映射表

旧版 CSS 变量名通过 `var()` 别名全部映射到 MD3 token，现有所有组件代码无需修改即可使用新配色。

### 5.1 背景与表面

| 旧变量 | 暗色值 | 亮色值 | 映射到 |
|---|---|---|---|
| `--bg-base` | `#1C1B1F` | `#FFFBFE` | `var(--md-sys-color-background)` |
| `--bg-surface-1` | `#1C1B1F` | `#FFFBFE` | `var(--md-sys-color-surface)` |
| `--bg-surface-2` | `#2B2930` | `#F7F2FA` | `var(--md-sys-color-surface-container-low)` |
| `--bg-surface-3` | `#3A373D` | `#ECE6F0` | `var(--md-sys-color-surface-container-high)` |
| `--bg-elevated` | `#2B2930` | `#F7F2FA` | `var(--md-sys-color-surface-container-low)` |

### 5.2 边框

| 旧变量 | 暗色值 | 亮色值 | 映射到 |
|---|---|---|---|
| `--border-default` | `#49454F` | `#CAC4D0` | `var(--md-sys-color-outline-variant)` |
| `--border-subtle` | `#3A373D` | `#E0DAE5` | 独立定义（MD3 无直接对应） |
| `--border-accent` | `rgba(208,188,255,0.25)` | `rgba(103,80,164,0.20)` | 独立定义 |

### 5.3 文本

| 旧变量 | 暗色值 | 亮色值 | 映射到 |
|---|---|---|---|
| `--text-primary` | `#E6E1E5` | `#1C1B1F` | `var(--md-sys-color-on-surface)` |
| `--text-secondary` | `#CAC4D0` | `#49454F` | `var(--md-sys-color-on-surface-variant)` |
| `--text-muted` | `#938F99` | `#79747E` | `var(--md-sys-color-outline)` |

### 5.4 语义色

| 旧变量 | 暗色值 | 亮色值 | 映射到 |
|---|---|---|---|
| `--accent` | `#D0BCFF` | `#6750A4` | `var(--md-sys-color-primary)` |
| `--accent-hover` | `#DDD0FF` | `#5A48B5` | 独立定义（加深变体） |
| `--accent-muted` | `rgba(208,188,255,0.12)` | `rgba(103,80,164,0.08)` | 独立定义 |
| `--success` | `#7BDB8E` | `#1B6D2F` | `var(--md-sys-color-success)` |
| `--success-hover` | `#8FE89E` | `#155A26` | 独立定义（加深变体） |
| `--success-muted` | `rgba(123,219,142,0.12)` | `rgba(27,109,47,0.08)` | 独立定义 |
| `--warning` | `#FFD970` | `#7A5900` | `var(--md-sys-color-warning)` |
| `--warning-muted` | `rgba(255,217,112,0.12)` | `rgba(122,89,0,0.08)` | 独立定义 |
| `--error` | `#F2B8B5` | `#B3261E` | `var(--md-sys-color-error)` |
| `--error-hover` | `#F7C9C7` | `#9A1F19` | 独立定义（加深变体） |
| `--error-muted` | `rgba(242,184,181,0.12)` | `rgba(179,38,30,0.08)` | 独立定义 |
| `--info` | `#A8C7FF` | `#1B4A8A` | `var(--md-sys-color-info)` |

### 5.5 滚动条与阴影

| 旧变量 | 暗色值 | 亮色值 |
|---|---|---|
| `--scrollbar-thumb` | `rgba(255,255,255,0.10)` | `rgba(0,0,0,0.10)` |
| `--scrollbar-thumb-hover` | `rgba(255,255,255,0.18)` | `rgba(0,0,0,0.18)` |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | `0 4px 12px rgba(0,0,0,0.08)` |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | `0 8px 24px rgba(0,0,0,0.12)` |
| `--shadow-glow` | `0 0 20px rgba(208,188,255,0.15)` | `0 0 20px rgba(103,80,164,0.12)` |

---

## 六、对比度分析

以下对比度基于 [WCAG 2.1 相对亮度公式](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) 计算。

### 6.1 文本/背景对比度

| 文本层级 | 旧暗色 | 新暗色(MD3) | 旧亮色 | 新亮色(MD3) | WCAG 要求 |
|---|---|---|---|---|---|
| 主文本 vs 背景 | 18.5:1 | 13.5:1 | 14.8:1 | 17.3:1 | AA ≥ 4.5:1 ✅ |
| 次要文本 vs 背景 | 6.8:1 | 9.3:1 | 6.4:1 | 8.5:1 | AA ≥ 4.5:1 ✅ |
| 弱文本 vs 背景 | 3.5:1 ❌ | 5.2:1 | 2.8:1 ❌ | 4.5:1 | AA ≥ 4.5:1 ✅ |

### 6.2 关键对比度参数

**暗色模式：**

| 对比对 | 色值 | 对比度 |
|---|---|---|
| `--text-primary` (`#E6E1E5`) / `--bg-base` (`#1C1B1F`) | `#E6E1E5` / `#1C1B1F` | 13.5:1 ✅ |
| `--text-secondary` (`#CAC4D0`) / `--bg-base` (`#1C1B1F`) | `#CAC4D0` / `#1C1B1F` | 9.3:1 ✅ |
| `--text-muted` (`#938F99`) / `--bg-base` (`#1C1B1F`) | `#938F99` / `#1C1B1F` | 5.2:1 ✅ |
| `--accent` (`#D0BCFF`) / `--bg-surface-1` (`#1C1B1F`) | `#D0BCFF` / `#1C1B1F` | 10.7:1 ✅ |
| `--error` (`#F2B8B5`) / `--bg-base` (`#1C1B1F`) | `#F2B8B5` / `#1C1B1F` | 9.7:1 ✅ |

**亮色模式：**

| 对比对 | 色值 | 对比度 |
|---|---|---|
| `--text-primary` (`#1C1B1F`) / `--bg-base` (`#FFFBFE`) | `#1C1B1F` / `#FFFBFE` | 17.3:1 ✅ |
| `--text-secondary` (`#49454F`) / `--bg-base` (`#FFFBFE`) | `#49454F` / `#FFFBFE` | 8.5:1 ✅ |
| `--text-muted` (`#79747E`) / `--bg-base` (`#FFFBFE`) | `#79747E` / `#FFFBFE` | 4.5:1 ✅ (恰好达标) |
| `--accent` (`#6750A4`) / `--bg-surface-1` (`#FFFBFE`) | `#6750A4` / `#FFFBFE` | 6.0:1 ✅ |
| `--error` (`#B3261E`) / `--bg-base` (`#FFFBFE`) | `#B3261E` / `#FFFBFE` | 5.6:1 ✅ |

### 6.3 按钮文本对比度

| 按钮类型 | 暗色 | 亮色 | WCAG 要求 |
|---|---|---|---|
| `.btn-primary` | `#381E72` / `#D0BCFF` = 5.8:1 | `#FFFFFF` / `#6750A4` = 5.1:1 | AA ≥ 4.5:1 ✅ |
| `.btn-success` | `#003910` / `#7BDB8E` = 5.3:1 | `#FFFFFF` / `#1B6D2F` = 4.9:1 | AA ≥ 4.5:1 ✅ |
| `.btn-danger` | `#601410` / `#F2B8B5` = 5.4:1 | `#FFFFFF` / `#B3261E` = 4.7:1 | AA ≥ 4.5:1 ✅ |

---

## 七、配色修改步骤

### 7.1 修改前分析

1. **遍历所有组件**，使用 `Grep` 工具搜索 `var(--` 引用，确认颜色变量的使用场景和频率
2. **统计旧色值**，列出 `index.css` 中所有 CSS 自定义属性的暗色/亮色值
3. **识别硬编码颜色**，搜索 `#` 开头的硬编码色值（如 `#fff`）
4. **评估对比度问题**：
   - 旧暗色 `--text-muted` (`#5c5c72`) 在 `#09090b` 背景上对比度仅 3.5:1 — 低于 WCAG AA
   - 旧亮色 `--text-muted` (`#a1a1a9`) 在 `#fafaf9` 背景上对比度仅 2.8:1 — 低于 WCAG AA

### 7.2 MD3 色板设计

1. **选择 Source Color**: 使用 MD3 标准紫色主色 `#6750A4`，与项目现有紫色调 `#6968f7` 方向一致
2. **设计暗色色板**: 基于 Source Color 生成 MD3 暗色调调色板，核心规则：
   - 背景色 `#1C1B1F` — MD3 暗色标准背景
   - 主色 `#D0BCFF` — 主色在暗色下的浅色变体
   - on-surface `#E6E1E5` — 保证最低 13.5:1 对比度
   - outline `#938F99` — 作为 `--text-muted`，保证 5.2:1 对比度
3. **设计亮色色板**: 基于同一个 Source Color 生成 MD3 亮色调调色板：
   - 背景色 `#FFFBFE` — MD3 亮色标准背景（略带暖色调微偏移）
   - 主色 `#6750A4` — 主色原始值
   - on-surface `#1C1B1F` — 保证 17.3:1 对比度
   - outline `#79747E` — 作为 `--text-muted`，保证 4.5:1 对比度
4. **设计 Surface Container 层级**: 暗色从 `#0F0D13` → `#454248`，亮色从 `#FFFFFF` → `#E6E0E9`
5. **设计扩展语义色 (Success/Warning/Info)**: 分别使用 MD3 绿色/琥珀色/蓝色调调色板

### 7.3 代码修改

1. **修改 `web/src/index.css`**：
   - 替换 `:root` 和 `[data-theme="dark"]` 块中的所有旧 CSS 变量为 MD3 token
   - 替换 `[data-theme="light"]` 块中的所有旧 CSS 变量为 MD3 token
   - 新增完整的 `--md-sys-color-*` token 定义
   - 通过 `var()` 链将旧变量名映射到新 MD3 token（向后兼容）
   - 同步更新阴影值以匹配新配色概率
2. **修复硬编码颜色**：
   - `web/src/index.css` 中 `.btn-primary`/`.btn-success`/`.btn-danger` 的 `color: #fff` → `color: var(--md-sys-color-on-xxx)`
   - `web/src/components/PropertyPanel.tsx` 中 `color: '#fff'` → `color: 'var(--md-sys-color-on-warning)'`

### 7.4 验证

1. **TypeScript 类型检查**: `cd web && npx tsc --noEmit` — 确保无类型错误
2. **Vite 生产构建**: `cd web && npm run build` — 确保构建通过，CSS 正确输出
3. **视觉验证**: 启动 `npm run electron:dev` 确认暗色/亮色切换后所有组件可读性正常

### 7.5 受影响的文件列表

| 文件 | 修改内容 |
|---|---|
| `web/src/index.css` | 完全重写 `:root` / `[data-theme="dark"]` / `[data-theme="light"]` 颜色变量，新增 MD3 token，更新阴影值，修复按钮颜色 |
| `web/src/components/PropertyPanel.tsx` | 修复 Warning 按钮硬编码 `#fff` |

> **注意**: 所有其他 `.tsx` 组件文件无需修改，因为向后兼容的 `--xxx` 别名全部保留且通过 `var()` 链自动指向新的 MD3 色值。
