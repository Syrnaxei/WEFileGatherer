## 优化一：加载性能优化（分阶段加载）

### 问题
点击"加载"按钮后，`POST /api/scan` 在响应前需要等待所有文件的 `probeVideoFile()` 调用完成（每个文件执行 `fs.stat` + `ffprobe`），导致 API 响应延迟，UI 冻结。

### 解决方案：三阶段加载

**阶段 1 — 立即返回基础结构**

[flows.ts](file:///e:/AAAProject/VideoFileProcessing/src/api/flows.ts) 中 `/scan` 和 `/scrape/scan` 路由改为：
- 仅执行目录扫描 + 文件名过滤 + `computeVideoHash`（纯计算，极快）
- 文件属性字段（`fileSize`/`duration`/`bitrate`）返回 `0`
- 立即 `res.json()` 返回，不等待探测

**阶段 2 — 异步探测 + 占位符显示**

- 后端新增 `startAsyncProbe()` 函数，在响应返回后异步执行 `probeVideoFile`
- 探测结果存入内存缓存 `probeCache`（Map），并通过 Socket.io `probe:ready` 事件推送
- 前端 `App.tsx` 将后端返回的 `0` 映射为 `undefined`，并标记 `probePending: true`
- [format.ts](file:///e:/AAAProject/VideoFileProcessing/web/src/utils/format.ts) 新增 `pending` 参数：当值为 `undefined` 且 `pending=true` 时显示 `---` 占位符

**阶段 3 — 轮询加载属性**

- 后端新增 `GET /api/probe-results?ids=id1,id2,...` 端点，返回已完成的探测结果
- 前端新增 [useProbePolling.ts](file:///e:/AAAProject/VideoFileProcessing/web/src/hooks/useProbePolling.ts) Hook：
  - 每 800ms 轮询一次 `probe-results` 端点
  - 仅请求 `probePending=true` 的文件 ID
  - 收到结果后更新对应文件的属性并清除 `probePending` 标记
  - 所有文件属性加载完成后自动停止轮询

---

## 优化二：FFmpeg 调用优化

### 问题
`startThumbnailGeneration()` 在视频列表为空时仍会执行 `getFfmpegInfo()` 和设置读取，产生不必要的日志输出。

### 解决方案

在 `startThumbnailGeneration()` 函数入口添加前置检查：

```typescript
if (!files || files.length === 0) {
  console.log(`[${logPrefix}] No files to generate thumbnails for, skipping`);
  return;
}
```

同时在 `/scan` 和 `/scrape/scan` 路由中，当文件列表为空时提前返回，跳过 `resolveFfprobeCmd`、`startAsyncProbe` 和 `startThumbnailGeneration` 调用。

---

## 文件变更清单

| 文件 | 变更 |
|------|------|
| [src/api/flows.ts](file:///e:/AAAProject/VideoFileProcessing/src/api/flows.ts) | 分阶段返回；新增 `probeCache`、`startAsyncProbe()`、`emitProbeReady()`、`GET /probe-results` 端点；空列表前置检查 |
| [web/src/hooks/useProbePolling.ts](file:///e:/AAAProject/VideoFileProcessing/web/src/hooks/useProbePolling.ts) | **新建** — 属性轮询 Hook |
| [web/src/utils/format.ts](file:///e:/AAAProject/VideoFileProcessing/web/src/utils/format.ts) | 三个格式化函数新增 `pending` 参数，支持 `---` 占位符 |
| [web/src/App.tsx](file:///e:/AAAProject/VideoFileProcessing/web/src/App.tsx) | 导入 `useProbePolling`；加载时映射 `0→undefined` + `probePending:true` |
| [web/src/components/FileList.tsx](file:///e:/AAAProject/VideoFileProcessing/web/src/components/FileList.tsx) | `FileItem` 接口新增 `probePending`；格式化调用传入 `pending` 参数 |
| [web/src/components/ScrapePage.tsx](file:///e:/AAAProject/VideoFileProcessing/web/src/components/ScrapePage.tsx) | 格式化调用传入 `pending` 参数 |

