import { INode, NodeType, IMoverNodeConfig } from '../core/node';
import { IFileContext } from '../core/context';
import { safeMoveFile, resolveTemplate } from '../utils/io';
import { withRetry, classifyIOError, IOErrorType } from '../utils/retry';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 文件冲突处理策略
 */
export type ConflictResolution = 'overwrite' | 'skip' | 'cancel';

/**
 * MoverNode（移动节点）- Phase 5 增强版
 *
 * 新增：基于文件名的冲突检测与处理
 * - overwrite: 覆盖目标文件
 * - skip: 跳过冲突文件，保留原有文件
 * - cancel: 由 API 层在启动前预检，MoverNode 不直接处理此策略
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
    const conflictResolution = (ctx.metadata._conflictResolution as ConflictResolution) || 'overwrite';

    console.log(`[MoverNode] ${ctx.originalFileName} → move: ${ctx.currentPath} => ${destPath} (conflict: ${conflictResolution})`);

    const destExists = await this.fileExists(destPath);

    if (destExists) {
      if (conflictResolution === 'skip') {
        console.log(`[MoverNode] ${ctx.originalFileName} skipped (destination exists): ${destPath}`);
        ctx.metadata._skipped = true;
        ctx.metadata._skipReason = 'conflict';
        return ctx;
      }

      if (conflictResolution === 'cancel') {
        const err = new Error(`文件冲突: ${path.basename(destPath)} 已存在于目标路径`);
        console.error(`[MoverNode] ${ctx.originalFileName} canceled: ${err.message}`);
        throw err;
      }
    }

    try {
      await withRetry(
        () => safeMoveFile(ctx.currentPath, destPath, { overwrite: conflictResolution === 'overwrite' }),
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

  /**
   * 检测目标路径是否已存在同名文件
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(filePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /**
   * 静态方法：批量预检目标路径是否存在同名文件冲突
   * 用于 "cancel" 模式下在启动流程前进行全量冲突检查
   */
  static async checkConflicts(
    files: Array<{ fileName: string; targetPath: string }>
  ): Promise<string[]> {
    const conflicts: string[] = [];
    for (const file of files) {
      const destPath = path.join(file.targetPath, file.fileName);
      try {
        const stat = await fs.stat(destPath);
        if (stat.isFile()) {
          conflicts.push(file.fileName);
        }
      } catch {
        // 文件不存在，无冲突
      }
    }
    return conflicts;
  }
}
