# 缩略图视图布局间距比例系统 — 实现计划

## 分析结论

ThumbnailView（缩略图视图）**没有使用** ListView 的布局间距比例系统，两者的设计完全不同：

| 方面 | ThumbnailView | ListView |
|------|--------------|----------|
| 列数 | 5 列 | 4 列 |
| 预览列 | 固定像素（80px/72px） | 无 |
| Tag 列 | 固定 160px | minmax(140px, 2fr) |
| 操作列 | 固定 40px | minmax(60px, 1fr) |
| 列间距 | 硬编码 `'12px'` | 命名常量 `GRID_GAP = '16px'` |
| 行内边距 | 硬编码 `'10px 20px'` | 命名常量 `ROW_PADDING = '10px 12px'` |

但 ThumbnailView 的布局值全部是魔法数字，没有命名常量，不利于维护。

---

## 实施步骤

### 步骤 1：在 FileList.tsx 的 ThumbnailView 中提取命名常量

在 `ThumbnailView` 函数体内，将以下硬编码值提取为命名常量：

```ts
const THUMB_GRID_GAP = '12px';
const THUMB_ROW_PADDING = '10px 20px';
const THUMB_HEADER_PADDING = '8px 20px';
const THUMB_COL_PREVIEW_SINGLE = 80;   // 单缩略图预览列宽
const THUMB_COL_PREVIEW_MULTI = 72;    // 多缩略图预览列宽
const THUMB_THUMB_HEIGHT_SINGLE = 45;  // 单缩略图高度
const THUMB_THUMB_HEIGHT_MULTI = 40;   // 多缩略图高度
const THUMB_COL_TAG = '160px';         // Tag 列宽
const THUMB_COL_ACTION = '40px';       // 操作列宽
```

使用这些常量替代原有的硬编码值：

- 替换 `gap: '12px'` → `gap: THUMB_GRID_GAP`
- 替换 `padding: '10px 20px'`（行）→ `padding: THUMB_ROW_PADDING`
- 替换 `padding: '8px 20px'`（表头）→ `padding: THUMB_HEADER_PADDING`
- 替换 `thumbColWidth` 计算 → 使用 `THUMB_COL_PREVIEW_SINGLE` / `THUMB_COL_PREVIEW_MULTI`
- 替换 `thumbHeight` 计算 → 使用 `THUMB_THUMB_HEIGHT_SINGLE` / `THUMB_THUMB_HEIGHT_MULTI`
- 替换 `gridCols` 中的 `160px` → `THUMB_COL_TAG`
- 替换 `gridCols` 中的 `40px` → `THUMB_COL_ACTION`

### 步骤 2：更新 docs/布局间距比例系统.md

在现有文档末尾添加新章节：

```markdown
## 三、工作台缩略图视图 (FileList.tsx — ThumbnailView)

### 设计原则

缩略图视图比列表视图多一列"预览"，用于展示视频缩略图。预览列和操作列使用固定像素宽度，文件名和目标路径列使用 `fr` 弹性分配剩余空间。

### 列宽比例

```
预览(固定) + 文件名(1fr) + Tag(固定) + 目标路径(1fr) + 操作(固定)
```

| 列 | 宽度 | 单位 | 用途 |
|----|------|------|------|
| 预览 | `THUMB_COL_PREVIEW_SINGLE` (80px) 或 `THUMB_COL_PREVIEW_MULTI` (72px) | px | 视频缩略图预览 |
| 文件名 | `1fr` | fr | 弹性分配剩余空间 |
| Tag | `THUMB_COL_TAG` (160px) | px | Tag 下拉选择器 |
| 目标路径 | `1fr` | fr | 弹性分配剩余空间 |
| 操作 | `THUMB_COL_ACTION` (40px) | px | 删除按钮 |

### 间距常量

| 常量 | 当前值 | 说明 | 建议范围 |
|------|--------|------|----------|
| `THUMB_GRID_GAP` | `12px` | 列间距 | 8px ~ 20px |
| `THUMB_ROW_PADDING` | `10px 20px` | 行内边距 (垂直 水平) | 垂直 8~14px, 水平 12~20px |
| `THUMB_HEADER_PADDING` | `8px 20px` | 表头内边距 | 与行内边距保持视觉一致 |
| `THUMB_COL_PREVIEW_SINGLE` | `80px` | 单缩略图预览列宽 | 70px ~ 100px |
| `THUMB_COL_PREVIEW_MULTI` | `72px` | 多缩略图预览列宽 | 60px ~ 90px |
| `THUMB_THUMB_HEIGHT_SINGLE` | `45px` | 单缩略图高度 | 40px ~ 60px |
| `THUMB_THUMB_HEIGHT_MULTI` | `40px` | 多缩略图高度 | 35px ~ 50px |
| `THUMB_COL_TAG` | `160px` | Tag 列宽 | 140px ~ 180px |
| `THUMB_COL_ACTION` | `40px` | 操作列宽 | 36px ~ 50px |

### 调整方法

1. **修改预览列宽**: 修改 `THUMB_COL_PREVIEW_SINGLE` / `THUMB_COL_PREVIEW_MULTI`
2. **修改缩略图高度**: 修改 `THUMB_THUMB_HEIGHT_SINGLE` / `THUMB_THUMB_HEIGHT_MULTI`
3. **修改 Tag 列宽**: 修改 `THUMB_COL_TAG`（建议范围: 140px ~ 180px）
4. **修改操作列宽**: 修改 `THUMB_COL_ACTION`（建议范围: 36px ~ 50px）
5. **修改列间距**: 修改 `THUMB_GRID_GAP`
6. **修改行内边距**: 修改 `THUMB_ROW_PADDING`
7. **修改表头内边距**: 修改 `THUMB_HEADER_PADDING`

> **注意**: 预览列和缩略图高度的值同时影响 `gridCols` 模板中的列宽和缩略图容器的宽高样式。修改时需保持两者一致。
```

### 步骤 3：验证

1. `cd web && npx tsc --noEmit` — 确保类型检查通过
2. `cd web && npm run lint` — 确保 lint 通过
3. `cd web && npm run build` — 确保构建通过