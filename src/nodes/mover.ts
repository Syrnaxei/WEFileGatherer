import { INode, NodeType, IMoverNodeConfig } from '../core/node';
import { IFileContext } from '../core/context';
import { safeMoveFile, resolveTemplate } from '../utils/io';
import { withRetry, classifyIOError, IOErrorType } from '../utils/retry';

/**
 * MoverNode（移动节点）- Phase 4 增强版
 *
 * 新增：使用 withRetry 包装 IO 操作，支持指数退避重试
 * 仅对瞬时错误（EBUSY、ETIMEOUT 等）进行重试，致命错误直接抛出
 */
export class MoverNode implements INode<IMoverNodeConfig> {
  id: string;
  type = NodeType.Mover;
  config: IMoverNodeConfig;

  constructor(id: string, config: IMoverNodeConfig) {
    this.id = id;
    this.config = config;
  }

  async handle(ctx: IFileContext): Promise<IFileContext> {
    const destPath = resolveTemplate(this.config.targetPathTemplate, ctx);

    console.log(`[MoverNode] ${ctx.originalFileName} → move: ${ctx.currentPath} => ${destPath}`);

    try {
      await withRetry(
        () => safeMoveFile(ctx.currentPath, destPath),
        {
          maxRetries: 3,
          baseDelay: 1000,
          backoffMultiplier: 2,
          retryOnlyTransient: true,
          onRetry: (err, attempt, nextDelay) => {
            const errorType = classifyIOError(err);
            console.log(
              `[MoverNode] ${ctx.originalFileName} retry ${attempt}/3 (${errorType}), next in ${nextDelay}ms`
            );
          },
        }
      );

      ctx.currentPath = destPath;
      console.log(`[MoverNode] ${ctx.originalFileName} moved successfully`);
    } catch (err: any) {
      const errorType = classifyIOError(err);
      console.error(
        `[MoverNode] ${ctx.originalFileName} error: move failed (${errorType}): ${err.message}`
      );
      throw err;
    }

    return ctx;
  }
}
