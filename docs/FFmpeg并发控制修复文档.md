# FFmpeg/FFprobe 并发控制修复文档

## 问题背景

在扫描视频文件时，后端会异步执行两类 I/O 密集型操作：

1. **ffprobe 探测**：获取视频文件的时长、码率、文件大小等元数据
2. **ffmpeg 缩略图生成**：为每个视频提取 N 帧缩略图

修复前，这两类操作均无并发控制，当扫描大量视频文件时可能导致：

- **CPU 抢占**：大量 ffmpeg/ffprobe 子进程与主程序（Express + Socket.io）争抢 CPU
- **内存压力**：每个 ffmpeg 进程约占用 30-80MB 内存，100 个同时运行可能占用 3-8GB
- **磁盘 I/O 瓶颈**：大量子进程同时读写磁盘，影响主程序的文件操作（如 MoverNode 的文件移动）

## 修复内容

### 1. ffprobe 探测并发控制

**文件**：`src/api/flows.ts` — `startAsyncProbe()`

**修复前**：

```typescript
const results = await Promise.all(
  files.map(async (file) => {
    const result = await probeVideoFile(file.filePath, ffprobeCmd);
    // ...
  })
);
```

`Promise.all` 会同时启动所有文件的 ffprobe 进程，100 个文件 = 100 个 ffprobe 子进程同时运行。

**修复后**：

```typescript
const probeConcurrency = Math.min(5, Math.max(1, parseInt(db.getSetting('concurrency') || '5', 10)));
const probeQueue = new PromiseQueue(probeConcurrency);

const results = await Promise.all(
  files.map((file) =>
    probeQueue.add(async () => {
      const result = await probeVideoFile(file.filePath, ffprobeCmd);
      // ...
    })
  )
);
```

使用 `PromiseQueue` 限制同时运行的 ffprobe 进程数量，上限为用户设置的 `concurrency` 值（1-5）。

### 2. ffmpeg 缩略图生成并发控制

**文件**：`src/api/flows.ts` — `startThumbnailGeneration()`

**修复前**：

```typescript
for (const file of files) {
  generateThumbnailsForVideo(...)  // 无 await，所有文件同时启动
    .then(...)
    .catch(...);
}
```

100 个视频文件会同时启动 100 个 `generateThumbnailsForVideo` 调用，每个内部又串行生成多帧。

**修复后**：

```typescript
const thumbnailConcurrency = Math.min(3, Math.max(1, parseInt(db.getSetting('concurrency') || '5', 10)));
const thumbnailQueue = new PromiseQueue(thumbnailConcurrency);

for (const file of files) {
  thumbnailQueue.add(() =>
    generateThumbnailsForVideo(...)
      .then(...)
      .catch(...)
  );
}
```

使用 `PromiseQueue` 限制同时运行的 ffmpeg 缩略图生成进程数量，上限为 `min(3, concurrency)`。

### 并发上限设计

| 操作 | 并发上限 | 说明 |
|------|----------|------|
| ffprobe 探测 | `min(5, concurrency)` | ffprobe 是轻量操作，允许与用户设置一致 |
| ffmpeg 缩略图 | `min(3, concurrency)` | ffmpeg 是重量操作，硬性上限为 3，避免资源过度占用 |

两个队列独立运行，互不影响。当 `concurrency` 设置为 1（FIFO 模式）时，两者均退化为串行执行。

## 技术实现

### PromiseQueue

项目已有 `src/utils/queue.ts` 中的 `PromiseQueue` 类，`FlowRunner` 也在使用同一实现。其核心逻辑：

- 维护一个任务队列和当前运行计数
- 当运行数 < 并发上限时，从队列取出任务执行
- 任务完成（无论成功或失败）后自动调度下一个任务
- 通过 `add()` 方法返回 Promise，支持 `Promise.all` 组合

### 调用链路（修复后）

```
POST /api/scan
  → res.json() 先返回文件列表
  → startAsyncProbe(files, ffprobeCmd, 'Scan')
    → PromiseQueue(concurrency=5) 控制同时运行的 ffprobe 数量
    → probePromise.then() → startThumbnailGeneration(filesWithDuration, 'Scan')
      → PromiseQueue(concurrency=3) 控制同时运行的 ffmpeg 数量
      → 每个视频内部串行生成多帧缩略图
```

## 影响范围

- **不影响 HTTP 响应**：`res.json()` 仍在 probe 和 thumbnail 之前返回
- **不影响缓存逻辑**：缩略图缓存命中时直接跳过，不进入队列
- **不影响前端交互**：通过 Socket.io 的 `thumbnail:ready` 和 `probe:ready` 事件仍正常推送
- **不影响文件处理**：`FlowRunner` 使用独立的 `PromiseQueue`，与 probe/thumbnail 队列互不干扰
