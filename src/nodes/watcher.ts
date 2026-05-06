import * as chokidar from 'chokidar';
import * as path from 'path';
import { INode, NodeType, IWatcherNodeConfig } from '../core/node';
import { IFileContext } from '../core/context';

/**
 * WatcherNode（入口节点）
 *
 * 职责：监听指定目录，发现新视频文件后生成 IFileContext。
 *
 * 技术选型：使用 chokidar 库。
 * 防抖机制：启用 awaitWriteFinish，确保大文件拷贝完成后再触发事件。
 */
export class WatcherNode implements INode<IWatcherNodeConfig> {
  id: string;
  type = NodeType.Watcher;
  config: IWatcherNodeConfig;
  private watcher?: chokidar.FSWatcher;

  constructor(id: string, config: IWatcherNodeConfig) {
    this.id = id;
    this.config = config;
  }

  /**
   * 初始化文件监听
   * @param onFileAdded 回调函数，当检测到合法新文件时调用，参数为文件绝对路径
   */
  init(onFileAdded: (filePath: string) => void): void {
    // 将用户输入的通配符模式转换为正则表达式
    // 例如 "*.mp4" 转换为匹配以 .mp4 结尾的字符串
    const patternStr = this.config.filePattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    const regex = new RegExp(patternStr, 'i');

    this.watcher = chokidar.watch(this.config.watchPath, {
      ignoreInitial: false,
      awaitWriteFinish: {
        /**
         * 稳定性阈值：文件大小在 2000ms 内无变化才触发 add 事件
         * 这是防止大文件拷贝未完成就开始流转的关键
         */
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    this.watcher.on('add', (filePath: string) => {
      const fileName = path.basename(filePath);
      if (!regex.test(fileName)) {
        console.log(`[WatcherNode] Ignored by pattern: ${filePath}`);
        return;
      }

      console.log(`[WatcherNode] Detected file ready: ${filePath}`);
      onFileAdded(filePath);
    });

    this.watcher.on('error', (error) => {
      console.error(`[WatcherNode] Watch error: ${error.message}`);
    });

    console.log(`[WatcherNode] Started watching: ${this.config.watchPath}`);
    console.log(`[WatcherNode] File pattern: ${this.config.filePattern}`);
  }

  /**
   * handle 方法在作为流的第一个节点执行时透传上下文
   * WatcherNode 本身不修改 Context（Context 在 init 回调中已由外部创建）
   */
  async handle(ctx: IFileContext): Promise<IFileContext> {
    console.log(`[WatcherNode] Passing through traceId=${ctx.traceId}`);
    return ctx;
  }

  /**
   * 停止文件监听
   */
  stop(): void {
    this.watcher?.close().then(() => {
      console.log(`[WatcherNode] Stopped watching: ${this.config.watchPath}`);
    });
  }
}
