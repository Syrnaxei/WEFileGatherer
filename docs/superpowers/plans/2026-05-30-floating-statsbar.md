# 浮动 WorkspaceStatsBar 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 WorkspaceStatsBar 改为毛玻璃浮动面板，吸附在文件列表底部

**Architecture:** 使用 `position: sticky; bottom: 0` 在可滚动容器内实现吸附效果。StatsBar 保持在 Page 组件内部，不提升到 App 层。FileList 新增 `statsBar` slot prop 用于注入。

**Tech Stack:** React 19 + TypeScript 6 + CSS variables (design system)

---

### Task 1: WorkspaceStatsBar 玻璃质感样式更新

**Files:**
- Modify: `web/src/components/winui/WorkspaceStatsBar.tsx`

- [ ] **Step 1: 更新样式 — 移除 borderBottom，添加玻璃质感 + sticky 定位**

将 WorkspaceStatsBar 外层 div 的 `borderBottom` 移除，替换为玻璃质感样式（大圆角、半透明背景、模糊、阴影），并添加 sticky 定位。

修改位置：第 55-63 行的外层 div style 属性。

```tsx
// 替换第 54-63 行的 return 开头部分：
return (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '10px 20px',
    background: 'rgba(37,37,54,0.88)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    userSelect: 'none',
    position: 'sticky',
    bottom: 0,
  }}>
```

完整的 return 语句为：

```tsx
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      padding: '10px 20px',
      background: 'rgba(37,37,54,0.88)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      userSelect: 'none',
      position: 'sticky',
      bottom: 0,
    }}>
      {/* 待处理主指标 — 保持不变 */}
      ...
      {/* 分隔线 — 保持不变 */}
      ...
      {/* 统计指标 — 保持不变 */}
      ...
      {/* 弹性空间 — 保持不变 */}
      ...
      {/* 操作按钮组 — 保持不变 */}
      ...
    </div>
  );
```

- [ ] **Step 2: 前端类型检查**

```bash
cd web && npx tsc --noEmit
```

Expected: 零错误。

- [ ] **Step 3: 提交**

```bash
git add web/src/components/winui/WorkspaceStatsBar.tsx
git commit -m "feat: WorkspaceStatsBar 毛玻璃浮动面板样式

- 移除 borderBottom，改为 12px 大圆角
- 半透明背景 + backdrop-filter 模糊效果
- position: sticky; bottom: 0 吸附定位
- 添加阴影和边框增强层次感

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: FileList 添加 statsBar slot

**Files:**
- Modify: `web/src/components/FileList.tsx`

- [ ] **Step 1: FileListProps 添加 statsBar 可选属性**

在 FileListProps 接口中添加 `statsBar` 属性（第 24-37 行）：

```tsx
interface FileListProps {
  files: FileItem[];
  onTagChange: (index: number, tag: string) => void;
  onRemove: (index: number) => void;
  savedTags: SavedTag[];
  getTargetPathForTag: (tagName: string) => string;
  isDark: boolean;
  isRunning?: boolean;
  showFullPath?: boolean;
  baseDir?: string;
  thumbnailCount?: number;
  viewMode?: ViewMode;
  ffmpegAvailable?: boolean;
  /** 底部插槽，渲染为 sticky 定位 */  // ← 新增
  statsBar?: React.ReactNode;            // ← 新增
}
```

- [ ] **Step 2: 解构 statsBar prop 并在滚动容器底部渲染**

解构 statsBar（第 56-64 行）：

```tsx
export default function FileList({
  files,
  onTagChange,
  onRemove,
  savedTags,
  getTargetPathForTag,
  isRunning,
  thumbnailCount = 1,
  statsBar,  // ← 新增
}: FileListProps) {
```

在滚动容器内，lightbox 之前添加 statsBar 渲染（原第 141-142 行之间插入）：

```tsx
      {/* 文件卡片列表 */}
      {files.length > 0 && (
        <div style={{ padding: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {files.map((file, index) => (
            <FileCard ... />
          ))}
        </div>
      )}

      {/* 底部浮动插槽 — sticky 吸附 */}
      {statsBar}

      {/* 缩略图灯箱 */}
      {lightbox && files[lightbox.fileIndex]?.videoHash && (
        ...
      )}
```

完整修改后的 return 结构：

```tsx
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      background: 'var(--settings-page-bg)',
    }}>
      {/* 表头 — 不变 */}
      ...

      {/* 空状态 — 不变 */}
      {files.length === 0 && (...)}

      {/* 文件卡片列表 — 不变 */}
      {files.length > 0 && (
        <div style={{ padding: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {files.map((file, index) => (...))}
        </div>
      )}

      {/* 底部浮动插槽 */}
      {statsBar}

      {/* 缩略图灯箱 — 不变 */}
      {lightbox && files[lightbox.fileIndex]?.videoHash && (...)}
    </div>
  );
```

- [ ] **Step 3: 前端类型检查**

```bash
cd web && npx tsc --noEmit
```

Expected: 零错误。

- [ ] **Step 4: 提交**

```bash
git add web/src/components/FileList.tsx
git commit -m "feat: FileList 添加 statsBar slot 支持

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: WorkspacePage 传递 statsBar

**Files:**
- Modify: `web/src/components/WorkspacePage.tsx`

- [ ] **Step 1: 移除顶层 WorkspaceStatsBar，改为通过 FileList 的 statsBar prop 传递**

修改位置：原第 86-95 行的 `<WorkspaceStatsBar .../>` 需要移除，改为通过 FileList 的 `statsBar` prop 传递。

移除 WorkspacePage 中独立的 `<WorkspaceStatsBar .../>`（第 86-95 行），在 FileList 组件上添加 `statsBar` prop：

```tsx
// 移除掉：
// <WorkspaceStatsBar
//   total={total}
//   tagged={tagged}
//   processed={processedCount}
//   failed={failed}
//   isRunning={isRunning}
//   onLoad={onLoad}
//   onStart={onStart}
//   onStop={onStop}
// />

// 在 FileList 上添加 statsBar prop：
<FileList
  files={files}
  onTagChange={onTagChange}
  onRemove={onRemove}
  savedTags={savedTags}
  getTargetPathForTag={getTargetPathForTag}
  isDark={isDark}
  isRunning={isRunning}
  showFullPath={showFullPath}
  baseDir={wfpPath}
  thumbnailCount={thumbnailCount}
  viewMode="thumbnail"
  ffmpegAvailable={ffmpegAvailable}
  statsBar={
    <WorkspaceStatsBar
      total={total}
      tagged={tagged}
      processed={processedCount}
      failed={failed}
      isRunning={isRunning}
      onLoad={onLoad}
      onStart={onStart}
      onStop={onStop}
    />
  }
/>
```

- [ ] **Step 2: 前端类型检查**

```bash
cd web && npx tsc --noEmit
```

Expected: 零错误。

- [ ] **Step 3: 提交**

```bash
git add web/src/components/WorkspacePage.tsx
git commit -m "feat: WorkspacePage 将 StatsBar 移入 FileList 浮动插槽

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: ScrapePage 移动 StatsBar 到滚动容器内

**Files:**
- Modify: `web/src/components/ScrapePage.tsx`

- [ ] **Step 1: 将 WorkspaceStatsBar 从顶部移至滚动容器底部**

移除第 130-138 行的独立 `<WorkspaceStatsBar .../>`，将其移至文件卡片列表之后（原第 200-201 行的 `</div>` 之后，`</div>` 关闭滚动容器之前）。

移除处（第 130-138 行）：
```tsx
// 删除这 9 行：
// <WorkspaceStatsBar
//   total={total}
//   processed={processedCount}
//   failed={failed}
//   isRunning={isRunning}
//   onLoad={onLoad}
//   onStart={onStart}
//   onStop={onStop}
// />
```

在滚动容器底部（卡片列表之后，第 201 行 `)}` 之后，第 202 行 `</div>` 之前）添加 StatsBar：

```tsx
            ) : (
              <div style={{ padding: '0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {files.map((file, index) => (
                  <ScrapeFileCard ... />
                ))}
              </div>
            )}

            {/* 浮动 StatsBar — sticky 吸附底部 */}
            <WorkspaceStatsBar
              total={total}
              processed={processedCount}
              failed={failed}
              isRunning={isRunning}
              onLoad={onLoad}
              onStart={onStart}
              onStop={onStop}
            />
          </div>
```

- [ ] **Step 2: 前端类型检查**

```bash
cd web && npx tsc --noEmit
```

Expected: 零错误。

- [ ] **Step 3: 提交**

```bash
git add web/src/components/ScrapePage.tsx
git commit -m "feat: ScrapePage 将 StatsBar 移入滚动容器底部浮动

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: 全量类型检查验证

- [ ] **Step 1: 运行全量类型检查**

```bash
cd E:/AAAProject/VideoFileProcessing && npx tsc --noEmit && npx tsc -p tsconfig.electron.json --noEmit && cd web && npx tsc --noEmit
```

Expected: 三个目标均零错误。

- [ ] **Step 2: 提交（如有未提交变更）**

```bash
git status
# 如有未提交变更则提交
```
