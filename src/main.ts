import { WatcherNode } from './nodes/watcher';
import { TaggerNode } from './nodes/tagger';
import { MoverNode } from './nodes/mover';
import { FlowRunner } from './core/runner';
import { IFlow } from './core/flow';
import { IFileContext } from './core/context';
import { TagGenerationRule } from './core/node';
import { config } from './config';
import * as path from 'path';

/**
 * ============================================================
 * 示例：编排三个节点，构建一个 IFlow，并用 FlowRunner 运行
 * ============================================================
 *
 * 场景：
 * 1. 监听配置目录，等待视频文件写入完成
 * 2. 为文件生成 UUID Tag，并从文件名中提取日期作为 Tag
 * 3. 将文件移动到配置的目标目录
 */

// 1. 创建节点实例（路径通过 .env 软编码）
const watcher = new WatcherNode('node-watcher', {
  watchPath: config.watchPath,
  filePattern: config.filePattern,
});

const tagger = new TaggerNode('node-tagger', {
  rules: [
    { type: TagGenerationRule.UUID, params: {} },
    {
      type: TagGenerationRule.RegexExtract,
      params: {
        // 假设文件名格式为 "2024-01-01-video.mp4"，提取日期部分
        pattern: '^(\\d{4}-\\d{2}-\\d{2})',
      },
    },
    {
      type: TagGenerationRule.FixedPrefix,
      params: { prefix: 'PROCESSED_' },
    },
  ],
});

const mover = new MoverNode('node-mover', {
  targetPathTemplate: config.outputTemplate,
  overwrite: config.overwrite,
});

// 2. 构建工作流（线性链：watcher → tagger → mover）
const flow: IFlow = {
  id: 'flow-demo',
  name: 'SVFP Flow',
  nodes: [watcher, tagger, mover],
  edges: [
    { sourceId: 'node-watcher', targetId: 'node-tagger' },
    { sourceId: 'node-tagger', targetId: 'node-mover' },
  ],
};

// 3. 创建 FlowRunner（并发限制从 .env 读取）
const runner = new FlowRunner(flow, config.concurrency);

// 4. 初始化 Watcher，将新文件事件接入 Runner 队列
watcher.init((filePath: string) => {
  const ctx: IFileContext = {
    traceId: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    originalFileName: path.basename(filePath),
    originalPath: filePath,
    currentPath: filePath,
    tags: [],
    metadata: {
      detectedAt: new Date().toISOString(),
    },
  };

  console.log(`[main] New file detected, enqueuing traceId=${ctx.traceId}: ${filePath}`);

  runner.enqueue(ctx).catch((err) => {
    console.error(`[main] Unexpected runner error for traceId=${ctx.traceId}:`, err);
  });
});

console.log('[main] Flow is running. Watching for new files...');
console.log('[main] Press Ctrl+C to stop.');

// 5. 优雅退出处理
process.on('SIGINT', () => {
  console.log('\n[main] Received SIGINT, shutting down...');
  watcher.stop();
  // 给正在运行的任务一点时间完成（可选）
  setTimeout(() => process.exit(0), 1000);
});
