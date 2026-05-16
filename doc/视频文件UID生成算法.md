# 视频文件 UID 生成算法

## 1. 算法定义

位置：`src/utils/thumbnail.ts#L28-32`

```typescript
export function computeVideoHash(filePath: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(filePath);
  return hash.digest('hex').slice(0, 16);
}
```

---

## 2. 核心逻辑

| 步骤 | 说明 |
|------|------|
| **输入** | 视频文件的完整路径字符串（如 `E:\videos\video.mp4`） |
| **哈希算法** | SHA-256 |
| **截取长度** | 十六进制前 16 位 |
| **输出** | 16 位 hex 字符串（如 `2153e1bac083a3a6`） |

---

## 3. 关键设计决策

### 3.1 基于路径而非内容

哈希的输入是文件路径（`filePath`），不是文件二进制内容。这意味着：

| 操作 | hash 结果 | 说明 |
|------|-----------|------|
| 文件移动位置 | **不同 hash** | 路径改变，哈希值变化 |
| 同路径下内容变化 | **相同 hash** | 路径未变，哈希值不变 |
| 重命名文件 | **不同 hash** | 路径改变 |

这种设计服务于缩略图缓存机制 —— 缩略图与文件的存放位置绑定，而非文件内容绑定。

### 3.2 为什么用路径而非内容

缩略图缓存目录结构为 `{thumbDir}/{videoHash}/`，每个视频一个专属文件夹。使用路径作为哈希输入保证了：

- **相同路径 → 相同 hash → 命中缓存**
- **不需要读取文件内容来计算 hash**（IO 高效，检测速度极快）

若使用文件内容（如 inode + mtime）计算 hash，每次判断缓存是否有效都需要读取文件 metadata，增加 IO 开销。

### 3.3 截取前 16 位的原因

SHA-256 输出 64 位 hex（64 字符），项目截取前 16 位：

- **碰撞概率极低**：16 位 hex ≈ 18 quintillion（1.8×10^19）种可能
- **目录名简短**：文件系统友好，避免超长路径问题
- **实际使用中无感知冲突**：正常使用下不会遇到碰撞

---

## 4. 在项目中的应用

### 4.1 scan 接口 — 文件列表返回

```
POST /api/scan
  → 计算每个视频的 videoHash
  → 返回给前端: { id, fileName, filePath, videoHash, ... }
  → 前端用 videoHash 构造缩略图 URL
```

### 4.2 缩略图存储目录结构

```
%LOCALAPPDATA%\Temp\SVFPcache\
  ├── 2153e1bac083a3a6\    ← videoHash 文件夹
  │     ├── 1.jpg           ← 第1张缩略图
  │     └── 2.jpg           ← 第2张缩略图
  ├── a7f3d2e1b192c840\
  │     └── 1.jpg
  └── ...
```

### 4.3 静态文件服务

```
GET /api/thumbnail-files/{videoHash}/{序号}.jpg
  → Express 直接读取对应文件返回
```

### 4.4 缩略图生成

```
generateThumbnailsForVideo(videoPath, fileId, count)
  ① computeVideoHash(videoPath) → videoHash
  ② 创建缓存目录 {thumbDir}/{videoHash}/
  ③ 检查缓存是否已存在 → 命中则跳过
  ④ 调用 ffmpeg 生成 JPG 到缓存目录
```

---

## 5. 潜在注意事项

### 5.1 路径变化导致缓存失效

用户移动文件位置后，路径改变，hash 不同，缓存失效。这是有意为之的设计取舍。

| 场景 | 结果 |
|------|------|
| `D:\videos\a.mp4` → `E:\videos\a.mp4` | hash 变化，缓存失效 |
| 重装系统后路径不同 | hash 变化，缓存失效 |

### 5.2 符号链接 / UNC 路径

```
\\server\share\video.mp4   → hash A
Z:\video.mp4               → hash B（假设 Z: 映射到 \\server\share）
```

两个路径指向同一文件时会产生不同 hash，缓存不共享。

### 5.3 Windows 路径大小写

Windows 文件系统默认不区分大小写，但 SHA-256 计算区分：

```
E:\Videos\a.mp4   → hash A
E:\videos\a.mp4   → hash B
```

用户在不同大小写路径间切换时，hash 不同，缓存不共享。

### 5.4 路径规范化

当前实现直接使用传入的路径字符串计算 hash，未做任何规范化（如路径分隔符统一、大小写转换）。如果调用方传入的路径格式不一致，可能导致同一文件产生不同 hash。

---

## 6. 代码索引

| 文件位置 | 说明 |
|----------|------|
| `src/utils/thumbnail.ts#L28-32` | `computeVideoHash` 函数定义 |
| `src/api/flows.ts#L105` | scan 接口中调用计算 videoHash |
| `src/utils/thumbnail.ts#L244` | `generateThumbnailsForVideo` 中调用计算 videoHash |
| `src/api/thumbnail.ts` | 缩略图静态文件服务，按 videoHash 路由 |
