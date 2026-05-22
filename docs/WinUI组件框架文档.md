# WinUI 组件框架文档

## 一、框架设计理念与架构说明

### 1.1 设计理念

WinUI 组件框架的设计灵感来源于 Microsoft 的 WinUI3 / Fluent Design 设计语言，旨在为 SVFP（视频文件处理）项目的前端界面提供一套统一、可复用、可组合的组件体系。

核心设计原则：

- **组件解耦**：每个组件只负责单一职责，通过 Props 接口与外部通信，不依赖特定页面上下文
- **样式一致性**：所有视觉表现通过 CSS 变量（`var(--xxx)`）驱动，自动适配深色/浅色主题，组件内部不硬编码颜色值
- **组合优先**：组件设计为可嵌套组合的积木块，复杂界面由简单组件层层组合而成
- **零侵入集成**：组件框架不改变任何后端 API 调用逻辑、数据流或业务状态管理方式

### 1.2 架构总览

```
web/src/components/winui/
├── index.ts                 # 统一导出入口
├── PageHeader.tsx           # 页面标题栏
├── SectionTitle.tsx         # 分组标题
├── SettingsSection.tsx      # 设置分组容器
├── SettingsTile.tsx         # 设置项行块
├── ExpandableTile.tsx       # 可展开/折叠的设置项
├── SettingsSubItem.tsx      # 子项行
├── SettingsSubItemDivider.tsx # 子项分隔线
├── ToggleSwitch.tsx         # 开关控件
├── DragHandle.tsx           # 拖拽手柄
├── ActionButton.tsx         # 操作按钮（含 EditIcon / DeleteIcon）
├── FolderSelectButton.tsx   # 文件夹选择按钮（支持自定义图标）
├── TagCard.tsx              # Tag 卡片（含拖拽、路径、描述）
└── SettingsIcons.tsx        # 设置页图标集合
```

架构层次：

```
┌─────────────────────────────────────────┐
│            页面层 (Pages)                │
│  SettingsPage / TagManagement           │
├─────────────────────────────────────────┤
│         业务组件 (Business)              │
│  TagCard                                │
├─────────────────────────────────────────┤
│          容器组件 (Container)            │
│  SettingsSection / ExpandableTile       │
├─────────────────────────────────────────┤
│          行项组件 (Row Items)            │
│  SettingsTile / SettingsSubItem         │
├─────────────────────────────────────────┤
│          控件组件 (Controls)             │
│  ToggleSwitch / ActionButton / DragHandle│
├─────────────────────────────────────────┤
│          基础元素 (Primitives)           │
│  PageHeader / SectionTitle / Icons      │
└─────────────────────────────────────────┘
```

---

## 二、组件分类、命名规范及使用方法

### 2.1 命名规范

| 类别 | 命名模式 | 示例 |
|------|----------|------|
| 页面标题 | `PageHeader` | `<PageHeader title="设置" />` |
| 分组容器 | `SettingsSection` | `<SettingsSection title="外观">` |
| 行项组件 | `XxxTile` / `XxxSubItem` | `<SettingsTile>`, `<ExpandableTile>` |
| 业务组件 | 业务实体名称 | `<TagCard>` |
| 控件组件 | 功能名称直述 | `<ToggleSwitch>`, `<DragHandle>` |
| 图标组件 | `XxxIcon` | `<ThemeIcon>`, `<FolderIcon>` |
| 文件命名 | PascalCase | `SettingsTile.tsx`, `ToggleSwitch.tsx` |

### 2.2 基础元素组件

#### PageHeader — 页面标题栏

页面顶部标题区域，显示页面主标题和可选描述。

```tsx
import { PageHeader } from './winui';

<PageHeader title="设置" description="应用配置与偏好设置" />
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | `string` | 是 | 页面标题 |
| `description` | `string` | 否 | 标题下方描述文字 |

#### SectionTitle — 分组标题

独立的分组标题文字，用于 `SettingsSection` 内部或独立场景。

```tsx
import { SectionTitle } from './winui';

<SectionTitle title="外观" />
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | `string` | 是 | 分组标题文字 |

### 2.3 容器组件

#### SettingsSection — 设置分组容器

将相关设置项组织在一个分组内，包含分组标题和内容区域。

```tsx
import { SettingsSection, SettingsTile, ToggleSwitch } from './winui';

<SettingsSection title="外观">
  <SettingsTile icon={<ThemeIcon />} title="选择外观模式" description="浅色、深色或跟随系统设置">
    <SelectDropdown options={[...]} value={mode} onChange={setMode} />
  </SettingsTile>
</SettingsSection>
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | `string` | 是 | 分组标题 |
| `children` | `React.ReactNode` | 是 | 分组内容（通常为 SettingsTile 或 ExpandableTile） |

#### ExpandableTile — 可展开/折叠的设置项

带展开/折叠动画的设置项容器，点击标题区域可切换展开状态。

```tsx
import { ExpandableTile, SettingsSubItem, ToggleSwitch } from './winui';

<ExpandableTile
  icon={<EyeIcon />}
  title="显示完整文件路径"
  description="控制工作台和搜刮界面是否显示文件的完整绝对路径"
  defaultExpanded={false}
>
  <SettingsSubItem label="工作台界面">
    <ToggleSwitch checked={value} onChange={handleChange} />
  </SettingsSubItem>
</ExpandableTile>
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `icon` | `React.ReactNode` | 是 | 左侧图标 |
| `title` | `string` | 是 | 标题文字 |
| `description` | `string` | 否 | 描述文字 |
| `badge` | `React.ReactNode` | 否 | 标题右侧徽标（如版本号） |
| `defaultExpanded` | `boolean` | 否 | 默认是否展开（默认 `false`） |
| `forceExpanded` | `boolean` | 否 | 强制展开状态（受控模式，忽略点击） |
| `onExpandChange` | `(expanded: boolean) => void` | 否 | 展开/折叠状态变更回调（非受控模式下触发） |
| `headerRightExtra` | `React.ReactNode` | 否 | 标题右侧额外内容（如按钮） |
| `children` | `React.ReactNode` | 是 | 展开后的内容 |

**受控模式说明**：

- **非受控模式**（`forceExpanded` 不传）：组件内部管理展开/折叠状态，`defaultExpanded` 设置初始值，点击标题自动切换
- **受控模式**（`forceExpanded` 传入布尔值）：展开状态完全由外部 `forceExpanded` 控制，点击标题时调用 `onExpandChange` 通知外部，由外部决定是否更新状态
- **强制展开不可折叠**（`forceExpanded={true}` 且不传 `onExpandChange`）：点击标题无效果，适用于编辑表单等场景

```tsx
// 非受控：用户可自由切换
<ExpandableTile title="..." defaultExpanded={false}>
  {children}
</ExpandableTile>

// 受控：外部控制，点击标题通知外部
<ExpandableTile title="..." forceExpanded={isExpanded} onExpandChange={setExpanded}>
  {children}
</ExpandableTile>

// 强制展开不可折叠：编辑模式
<ExpandableTile title="..." forceExpanded={true}>
  {children}
</ExpandableTile>
```

### 2.4 行项组件

#### SettingsTile — 设置项行块

单行设置项，左侧显示图标+标题+描述，右侧放置控件。

```tsx
import { SettingsTile, ToggleSwitch } from './winui';

<SettingsTile
  icon={<BellIcon />}
  title="通知持续时间"
  description="设置右下角通知持续显示时间（0-30s）"
>
  <InputNumber value={5} onChange={handleChange} min={0} max={30} unit="秒" />
</SettingsTile>
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `icon` | `React.ReactNode` | 是 | 左侧图标 |
| `title` | `string` | 是 | 标题文字 |
| `description` | `string` | 否 | 描述文字 |
| `children` | `React.ReactNode` | 是 | 右侧控件区域 |
| `style` | `React.CSSProperties` | 否 | 额外样式覆盖 |

#### SettingsSubItem — 子项行

用于 `ExpandableTile` 内部的子设置项，左侧标签，右侧控件。

```tsx
import { SettingsSubItem, ToggleSwitch } from './winui';

<SettingsSubItem label="工作台界面">
  <ToggleSwitch checked={value} onChange={handleChange} />
</SettingsSubItem>
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `label` | `string` | 是 | 左侧标签文字 |
| `children` | `React.ReactNode` | 否 | 右侧控件（无则显示 `-`） |

#### SettingsSubItemDivider — 子项分隔线

在 `ExpandableTile` 内部的子项之间插入分隔线。

```tsx
<SettingsSubItem label="项目A">
  <ToggleSwitch checked={a} onChange={setA} />
</SettingsSubItem>
<SettingsSubItemDivider />
<SettingsSubItem label="项目B">
  <ToggleSwitch checked={b} onChange={setB} />
</SettingsSubItem>
```

无 Props。

### 2.5 控件组件

#### ToggleSwitch — 开关控件

WinUI3 风格的开关切换控件。

```tsx
import { ToggleSwitch } from './winui';

<ToggleSwitch checked={isEnabled} onChange={(v) => setEnabled(v)} />
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `checked` | `boolean` | 是 | 当前开关状态 |
| `onChange` | `(v: boolean) => void` | 是 | 状态变更回调 |

#### ActionButton — 操作按钮

用于行内操作的图标按钮，支持默认和危险两种样式。

```tsx
import { ActionButton, EditIcon, DeleteIcon } from './winui';

<ActionButton onClick={() => startEdit(tag)} title="编辑">
  <EditIcon />
</ActionButton>
<ActionButton onClick={() => handleDelete(tag.id)} title="删除" variant="danger">
  <DeleteIcon />
</ActionButton>
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `onClick` | `(e: React.MouseEvent) => void` | 是 | 点击回调 |
| `title` | `string` | 是 | 按钮提示文字 |
| `variant` | `'default' \| 'danger'` | 否 | 按钮样式变体（默认 `'default'`） |
| `children` | `React.ReactNode` | 是 | 按钮内容（通常为图标） |

**导出的图标组件**：`EditIcon`、`DeleteIcon` — 从 `ActionButton.tsx` 中导出的 SVG 图标。

#### DragHandle — 拖拽手柄

用于拖拽排序的抓手图标。

```tsx
import { DragHandle } from './winui';

<DragHandle onMouseDown={(e) => handleDragStart(index, e)} />
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `onMouseDown` | `(e: React.MouseEvent) => void` | 是 | 鼠标按下回调（启动拖拽） |

#### FolderSelectButton — 文件夹选择按钮

带文件夹图标的操作按钮，用于触发文件夹选择对话框。支持自定义图标和文字。

```tsx
import { FolderSelectButton } from './winui';
import { FolderLinkIcon, FolderAddIcon } from './FluentIcons';

// 设置页 — 连接文件夹（使用 FolderLinkIcon）
<FolderSelectButton onClick={handleSelectFolder} text="连接文件夹" icon={<FolderLinkIcon size={18} />} />

// Tag 管理页 — 添加文件夹（使用 FolderAddIcon）
<FolderSelectButton onClick={handleAddFolder} text="添加文件夹" icon={<FolderAddIcon size={18} />} />

// 默认样式（使用 FolderAddIcon）
<FolderSelectButton onClick={handleSelectFolder} text="选择..." />
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `onClick` | `(e: React.MouseEvent) => void` | 是 | 点击回调 |
| `text` | `string` | 否 | 按钮文字（默认 `'选择...'`） |
| `icon` | `React.ReactNode` | 否 | 自定义图标（默认使用 `FolderAddIcon`） |

**图标约定**：
- **连接文件夹**（设置页目录选择）：使用 `FolderLinkIcon`，表示"链接到已有文件夹"
- **添加文件夹**（Tag 管理新建 Tag）：使用 `FolderAddIcon`，表示"添加新文件夹"

### 2.6 业务组件

#### TagCard — Tag 卡片

Tag 管理页面中展示单个 Tag 信息的卡片组件，包含拖拽手柄、图标、名称、目标路径、描述和操作按钮。

```tsx
import { TagCard } from './winui';
import { FluentTagIcon } from './FluentIcons';

<TagCard
  name={tag.name}
  targetPath={tag.target_path}
  description={tag.description}
  icon={<FluentTagIcon size={24} />}
  isDragging={dragIndex === index}
  onDragStart={(e) => handleDragMouseDown(index, e)}
  onEdit={() => startEdit(tag)}
  onDelete={() => handleDelete(tag.id, tag.name)}
/>
```

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | 是 | Tag 名称 |
| `targetPath` | `string` | 是 | 目标路径（以 accent 色、mono 字体显示） |
| `description` | `string` | 否 | 描述文字（以 muted 色显示） |
| `icon` | `React.ReactNode` | 是 | 左侧图标 |
| `isDragging` | `boolean` | 否 | 是否正在拖拽（高亮背景） |
| `onDragStart` | `(e: React.MouseEvent) => void` | 是 | 拖拽手柄鼠标按下回调 |
| `onEdit` | `() => void` | 是 | 编辑按钮回调 |
| `onDelete` | `() => void` | 是 | 删除按钮回调 |

**视觉结构**：
```
┌──────────────────────────────────────────────────┐
│ ⋮⋮  [🏷]  Tag名称                    [✏️] [🗑️] │
│           D:/Videos/Movies                        │
│           可选描述文字                             │
└──────────────────────────────────────────────────┘
  ↑拖拽   ↑图标   ↑名称+路径+描述         ↑操作按钮
```

### 2.7 图标组件

所有图标组件从 `SettingsIcons.tsx` 导出，均为无状态 SVG 图标，不接收 Props（固定 24×24 尺寸）。

```tsx
import {
  ThemeIcon,
  ViewIcon,
  ConflictIcon,
  BellIcon,
  TagAutoIcon,
  FolderIcon,
  FolderSearchIcon,
  FolderExportIcon,
  LayersIcon,
  TerminalIcon,
  MonitorIcon,
  CpuIcon,
  GaugeIcon,
  EyeIcon,
  ImageIcon,
  GridIcon,
  FolderCodeIcon,
  InfoIcon,
} from './winui';
```

| 图标组件 | 用途 |
|----------|------|
| `ThemeIcon` | 外观/主题设置 |
| `ViewIcon` | 视图模式切换 |
| `ConflictIcon` | 文件冲突处理 |
| `BellIcon` | 通知设置 |
| `TagAutoIcon` | Tag 自动填充 |
| `FolderIcon` | 源文件目录 |
| `FolderSearchIcon` | 搜刮文件夹 |
| `FolderExportIcon` | 导出文件夹 |
| `LayersIcon` | 搜刮深度 |
| `TerminalIcon` | 调试日志 |
| `MonitorIcon` | 日志显示 |
| `CpuIcon` | 处理模式 |
| `GaugeIcon` | 并发数 |
| `EyeIcon` | 显示完整路径 |
| `ImageIcon` | 缩略图质量 |
| `GridIcon` | 缩略图数量 |
| `FolderCodeIcon` | FFmpeg 路径 |
| `InfoIcon` | 版本信息 |

---

## 三、组件间通信机制

### 3.1 Props 下发（数据流）

所有组件遵循 React 单向数据流原则，数据通过 Props 从父组件向子组件传递：

```
Page
 └─ SettingsSection (title)
     ├─ SettingsTile (icon, title, description)
     │   └─ ToggleSwitch (checked, onChange)
     └─ ExpandableTile (icon, title, defaultExpanded)
         └─ SettingsSubItem (label)
             └─ ToggleSwitch (checked, onChange)
```

### 3.2 回调上传（事件流）

用户交互事件通过回调函数从子组件向父组件上传：

```tsx
// ToggleSwitch 内部触发 onChange，父组件接收新值
<ToggleSwitch
  checked={isEnabled}
  onChange={(newValue) => {
    setEnabled(newValue);                    // 更新本地状态
    fetch('/api/settings/key', {             // 持久化到后端
      method: 'POST',
      body: JSON.stringify({ value: String(newValue) }),
    });
  }}
/>
```

### 3.3 受控 vs 非受控模式

**ExpandableTile** 支持两种模式：

- **非受控模式**（默认）：使用 `defaultExpanded` 设置初始状态，组件内部管理展开/折叠状态
- **受控模式**：通过 `forceExpanded` 属性由外部控制展开状态，组件忽略用户点击

```tsx
// 非受控：用户可自由切换
<ExpandableTile title="..." defaultExpanded={false}>
  {children}
</ExpandableTile>

// 受控：外部控制，用户无法切换
<ExpandableTile title="..." forceExpanded={isEditing}>
  {children}
</ExpandableTile>
```

### 3.4 组件组合模式

组件通过 `children` 实现灵活组合：

```tsx
<SettingsSection title="分组标题">
  {/* 简单行项 */}
  <SettingsTile icon={<Icon />} title="标题">
    <ToggleSwitch checked={v} onChange={fn} />
  </SettingsTile>

  {/* 可展开项 */}
  <ExpandableTile icon={<Icon />} title="标题">
    <SettingsSubItem label="子项A">
      <ToggleSwitch checked={a} onChange={fnA} />
    </SettingsSubItem>
    <SettingsSubItemDivider />
    <SettingsSubItem label="子项B">
      <ToggleSwitch checked={b} onChange={fnB} />
    </SettingsSubItem>
  </ExpandableTile>
</SettingsSection>
```

---

## 四、开发规范与最佳实践

### 4.1 组件开发规范

1. **单一职责**：每个组件只做一件事。如果组件变得复杂，拆分为更小的子组件
2. **Props 接口优先**：使用 TypeScript interface 定义 Props，所有外部数据通过 Props 传入
3. **CSS 变量驱动**：所有颜色、间距使用 `var(--xxx)` 引用，不硬编码颜色值
4. **不传递 isDark**：组件内部不使用 `isDark` 判断颜色，由 CSS 变量自动处理深色/浅色主题
5. **中文注释**：所有代码必须包含中文注释，描述功能、逻辑或算法

### 4.2 组件文件模板

```tsx
import React from 'react';

/**
 * 组件名称 — 组件简述
 *
 * 详细描述组件的功能和用途
 */

interface MyComponentProps {
  /** 必填属性说明 */
  title: string;
  /** 可选属性说明 */
  description?: string;
  /** 事件回调说明 */
  onChange?: (value: string) => void;
}

export default function MyComponent({ title, description, onChange }: MyComponentProps) {
  return (
    <div className="my-component">
      <span>{title}</span>
      {description && <span>{description}</span>}
    </div>
  );
}
```

### 4.3 导出规范

新组件必须在 `index.ts` 中统一导出：

```ts
// web/src/components/winui/index.ts
export { default as MyComponent } from './MyComponent';
```

使用时从 `winui` 入口导入：

```tsx
import { MyComponent } from './winui';
```

### 4.4 样式规范

- 使用项目全局 CSS 类：`btn`, `btn-primary`, `btn-ghost`, `btn-outline`, `btn-danger`, `input`, `input-mono`, `badge`
- 组件特有样式使用 `className` 命名，遵循 `settings-xxx` / `winui-xxx` 前缀约定
- 动画时长统一使用 `150ms ease`（悬停/颜色变化）或 `200ms cubic-bezier(0.16, 1, 0.3, 1)`（开关/展开动画）
- 展开折叠动画使用 `grid-template-rows: 0fr → 1fr` 过渡

### 4.5 最佳实践

1. **组合优于继承**：通过 `children` 和 Props 组合组件，而非继承
2. **受控组件优先**：对于表单类控件，优先使用受控模式（value + onChange）
3. **避免内联样式**：优先使用 CSS 类名，仅在需要动态计算时使用内联 style
4. **保持向后兼容**：新增 Props 时提供默认值，不破坏现有使用方式
5. **图标统一管理**：新增图标放入 `SettingsIcons.tsx`，不单独创建图标文件

---

## 五、部署与集成指南

### 5.1 现有页面集成

将现有页面迁移到 WinUI 组件框架的步骤：

1. **导入组件**：从 `./winui` 导入所需组件
2. **替换页面外壳**：使用 `PageHeader` 替换原有的标题区域
3. **替换分组**：使用 `SettingsSection` 包裹每组设置项
4. **替换行项**：将内联的设置行替换为 `SettingsTile` 或 `ExpandableTile`
5. **替换控件**：将内联的开关、按钮替换为 `ToggleSwitch`、`ActionButton` 等
6. **验证功能**：确保所有交互逻辑和后端 API 调用保持不变

### 5.2 新页面开发

创建新页面的推荐结构：

```tsx
import { PageHeader, SettingsSection, SettingsTile, ExpandableTile } from './winui';

export default function NewPage() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--settings-page-bg)',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      <PageHeader title="页面标题" description="页面描述" />

      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SettingsSection title="分组一">
            <SettingsTile icon={<Icon />} title="设置项" description="说明">
              {/* 控件 */}
            </SettingsTile>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
```

### 5.3 扩展组件

当需要新增组件时：

1. 在 `web/src/components/winui/` 下创建新组件文件
2. 定义 TypeScript Props 接口
3. 实现组件，使用 CSS 变量驱动样式
4. 在 `index.ts` 中添加导出
5. 在页面中导入使用

### 5.4 构建验证

修改组件后，运行以下命令确保无类型错误和构建问题：

```bash
# 前端类型检查
cd web && npx tsc --noEmit

# 前端构建
cd web && npm run build

# 后端类型检查
npx tsc --noEmit
npx tsc -p tsconfig.electron.json --noEmit
```

### 5.5 依赖关系

WinUI 组件框架的依赖关系：

- **React**：核心框架（项目已有）
- **FluentIcons.tsx**：`FolderSelectButton` 默认使用 `FolderAddIcon`；`TagCard` 内部使用 `DragHandle`、`ActionButton`
- **全局 CSS**：组件使用 `index.css` 中定义的 CSS 类（`btn`, `input`, `badge` 等）和 CSS 变量
- **无第三方依赖**：组件框架不引入任何新的第三方库

---

## 六、组件与页面映射关系

### 6.1 设置页面（SettingsPage）

| 页面区域 | 使用的组件 |
|----------|-----------|
| 页面标题 | `PageHeader` |
| 外观设置 | `SettingsSection` → `SettingsTile` + `SelectDropdown` / `ToggleSwitch` |
| 通用设置 | `SettingsSection` → `SettingsTile` + `SelectDropdown` / `InputNumber` / `ToggleSwitch` |
| 工作台设置 | `SettingsSection` → `ExpandableTile` → `SettingsSubItem` + `FolderSelectButton` |
| 搜刮设置 | `SettingsSection` → `ExpandableTile` / `SettingsTile` |
| 高级设置 | `SettingsSection` → `SettingsTile` / `ExpandableTile` |
| FFmpeg 设置 | `SettingsSection` → `ExpandableTile` → `SettingsSubItem` |
| 缩略图设置 | `SettingsSection` → `SettingsTile` / `ExpandableTile` |
| 关于 | `SettingsSection` → `ExpandableTile` |

### 6.2 Tag 管理页面（TagManagement）

| 页面区域 | 使用的组件 |
|----------|-----------|
| 页面标题 | `PageHeader` |
| 新建 Tag | `SettingsSection` → `ExpandableTile` → `SettingsSubItem` + `FolderSelectButton`（FolderAddIcon） |
| 已有 Tag 列表 | `SettingsSection` → `TagCard`（含 DragHandle + ActionButton） |
| 编辑 Tag | `ExpandableTile`（受控模式 `forceExpanded`）→ `SettingsSubItem` + `FolderSelectButton`（FolderAddIcon） |
