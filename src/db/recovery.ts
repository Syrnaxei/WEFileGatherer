import { SQLiteDb, ContextStatus } from './sqlite';
import { IFileContext } from '../core/context';

/**
 * 崩溃恢复管理器
 *
 * 应用启动时：
 * 1. 查询 SQLite 中状态为 RUNNING 或 PENDING 的记录
 * 2. 对于 RUNNING 记录：标记为需要人工介入的警告状态
 * 3. 对于 PENDING 记录：可以自动重新入队处理
 */
export class RecoveryManager {
  private db: SQLiteDb;

  constructor() {
    this.db = SQLiteDb.getInstance();
  }

  /**
   * 执行崩溃恢复检查
   * @returns 恢复报告
   */
  checkAndRecover(): RecoveryReport {
    const candidates = this.db.findRecoveryCandidates();
    const report: RecoveryReport = {
      total: candidates.length,
      running: [],
      pending: [],
      recovered: 0,
      warnings: [],
    };

    for (const row of candidates) {
      const ctx: IFileContext = {
        traceId: row.trace_id,
        originalFileName: row.original_file_name,
        originalPath: row.original_path,
        currentPath: row.current_path,
        tags: JSON.parse(row.tags_json),
        metadata: JSON.parse(row.metadata_json),
      };

      if (row.status === ContextStatus.RUNNING) {
        // RUNNING 状态表示崩溃时正在处理中，需要人工检查
        report.running.push(ctx);
        report.warnings.push(
          `文件 "${row.original_file_name}" 在节点 ${row.current_node_id} 执行时中断，可能需要人工检查文件状态`
        );
      } else if (row.status === ContextStatus.PENDING) {
        // PENDING 状态表示尚未开始处理，可以安全地重新入队
        report.pending.push(ctx);
      }
    }

    console.log(`[RecoveryManager] Found ${report.running.length} interrupted, ${report.pending.length} pending files`);
    return report;
  }

  /**
   * 自动恢复 PENDING 状态的文件（可选调用）
   * @param enqueueFn 入队函数
   */
  async recoverPending(enqueueFn: (ctx: IFileContext) => Promise<void>): Promise<number> {
    const candidates = this.db.findRecoveryCandidates();
    let recovered = 0;

    for (const row of candidates) {
      if (row.status === ContextStatus.PENDING) {
        const ctx: IFileContext = {
          traceId: row.trace_id,
          originalFileName: row.original_file_name,
          originalPath: row.original_path,
          currentPath: row.current_path,
          tags: JSON.parse(row.tags_json),
          metadata: JSON.parse(row.metadata_json),
        };

        await enqueueFn(ctx);
        recovered++;
      }
    }

    return recovered;
  }
}

export interface RecoveryReport {
  total: number;
  running: IFileContext[];
  pending: IFileContext[];
  recovered: number;
  warnings: string[];
}
