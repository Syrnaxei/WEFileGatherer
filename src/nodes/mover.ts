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

    console.log(`[MoverNode] Preparing to move file for traceId=${ctx.traceId}`);
    console.log(`[MoverNode]   source: ${ctx.currentPath}`);
    console.log(`[MoverNode]   destination: ${destPath}`);

    try {
      // 使用 withRetry 包装 safeMoveFile，支持 3 次指数退避重试
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
              `[MoverNode] Retry ${attempt}/3 for traceId=${ctx.traceId} ` +
              `(${errorType}), next attempt in ${nextDelay}ms`
            );
          },
        }
      );

      ctx.currentPath = destPath;
      console.log(`[MoverNode] Move successful for traceId=${ctx.traceId}`);
    } catch (err: any) {
      const errorType = classifyIOError(err);
      console.error(
        `[MoverNode] Move failed (${errorType}) for traceId=${ctx.traceId}: ${err.message}`
      );
      throw err; // 向上抛给 FlowRunner 进行错误隔离
    }

    return ctx;
  }
}
