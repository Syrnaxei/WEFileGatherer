import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

let electronApp: any;
try {
  electronApp = require('electron').app;
} catch {
  electronApp = undefined;
}

/**
 * 文件流转状态枚举
 */
export enum ContextStatus {
  /** 刚进入队列，等待处理 */
  PENDING = 'PENDING',
  /** 正在某个节点执行中 */
  RUNNING = 'RUNNING',
  /** 已完成所有节点处理 */
  COMPLETED = 'COMPLETED',
  /** 移动操作成功 */
  MOVED = 'MOVED',
  /** 处理过程中发生错误 */
  ERROR = 'ERROR',
  /** 用户手动丢弃 */
  DISCARDED = 'DISCARDED',
}

/**
 * SQLite 数据库管理器
 * 负责表结构创建、CRUD 操作及事务管理
 */
export class SQLiteDb {
  private db: InstanceType<typeof Database>;
  private static instance: SQLiteDb;

  static getInstance(): SQLiteDb {
    if (!SQLiteDb.instance) {
      const dbPath = electronApp ? path.join(electronApp.getPath('userData'), 'vfp.db') : './data/vfp.db';
      SQLiteDb.instance = new SQLiteDb(dbPath);
    }
    return SQLiteDb.instance;
  }

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initTables();
  }

  /** 初始化表结构 */
  private initTables() {
    // 工作流配置表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tbl_flows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        nodes_json TEXT NOT NULL,
        edges_json TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // 文件流转历史表（核心 Checkpoint 表）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tbl_context_history (
        trace_id TEXT PRIMARY KEY,
        flow_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT '${ContextStatus.PENDING}',
        original_file_name TEXT NOT NULL,
        original_path TEXT NOT NULL,
        current_path TEXT NOT NULL,
        tags_json TEXT DEFAULT '[]',
        metadata_json TEXT DEFAULT '{}',
        current_node_id TEXT,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (flow_id) REFERENCES tbl_flows(id)
      )
    `);

    // 索引优化查询
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_context_flow_status 
      ON tbl_context_history(flow_id, status)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_context_status 
      ON tbl_context_history(status)
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tbl_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        target_path TEXT NOT NULL DEFAULT '',
        description TEXT DEFAULT '',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tbl_tags(name)
    `);

    const columns = this.db.pragma(`table_info(tbl_tags)`) as Array<{ name: string }>;
    const columnNames = columns.map((c) => c.name);
    if (!columnNames.includes('target_path')) {
      this.db.exec(`ALTER TABLE tbl_tags ADD COLUMN target_path TEXT NOT NULL DEFAULT ''`);
    }

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tbl_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT '',
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  }

  getDb(): InstanceType<typeof Database> {
    return this.db;
  }

  /**
   * 插入或更新文件流转记录（UPSERT）
   */
  upsertContext(params: {
    traceId: string;
    flowId: string;
    status: ContextStatus;
    originalFileName: string;
    originalPath: string;
    currentPath: string;
    tags: string[];
    metadata: Record<string, any>;
    currentNodeId?: string;
    errorMessage?: string;
    retryCount?: number;
  }) {
    const stmt = this.db.prepare(`
      INSERT INTO tbl_context_history (
        trace_id, flow_id, status, original_file_name, original_path,
        current_path, tags_json, metadata_json, current_node_id,
        error_message, retry_count, updated_at
      ) VALUES (
        @traceId, @flowId, @status, @originalFileName, @originalPath,
        @currentPath, @tagsJson, @metadataJson, @currentNodeId,
        @errorMessage, @retryCount, strftime('%s', 'now')
      )
      ON CONFLICT(trace_id) DO UPDATE SET
        status = excluded.status,
        current_path = excluded.current_path,
        tags_json = excluded.tags_json,
        metadata_json = excluded.metadata_json,
        current_node_id = excluded.current_node_id,
        error_message = excluded.error_message,
        retry_count = excluded.retry_count,
        updated_at = strftime('%s', 'now')
    `);

    stmt.run({
      traceId: params.traceId,
      flowId: params.flowId,
      status: params.status,
      originalFileName: params.originalFileName,
      originalPath: params.originalPath,
      currentPath: params.currentPath,
      tagsJson: JSON.stringify(params.tags),
      metadataJson: JSON.stringify(params.metadata),
      currentNodeId: params.currentNodeId ?? null,
      errorMessage: params.errorMessage ?? null,
      retryCount: params.retryCount ?? 0,
    });
  }

  /**
   * 按状态查询记录
   */
  findByStatus(status: ContextStatus): Array<{
    trace_id: string;
    flow_id: string;
    status: string;
    original_file_name: string;
    original_path: string;
    current_path: string;
    tags_json: string;
    metadata_json: string;
    current_node_id: string | null;
    error_message: string | null;
    retry_count: number;
  }> {
    const stmt = this.db.prepare(
      'SELECT * FROM tbl_context_history WHERE status = ? ORDER BY updated_at DESC'
    );
    return stmt.all(status) as any[];
  }

  /**
   * 查询崩溃恢复需要的记录（RUNNING 或 PENDING）
   */
  findRecoveryCandidates(flowId?: string) {
    const sql = flowId
      ? `SELECT * FROM tbl_context_history 
         WHERE flow_id = ? AND status IN ('${ContextStatus.RUNNING}', '${ContextStatus.PENDING}') 
         ORDER BY updated_at DESC`
      : `SELECT * FROM tbl_context_history 
         WHERE status IN ('${ContextStatus.RUNNING}', '${ContextStatus.PENDING}') 
         ORDER BY updated_at DESC`;

    const stmt = this.db.prepare(sql);
    return flowId ? (stmt.all(flowId) as any[]) : (stmt.all() as any[]);
  }

  /**
   * 统计各状态数量
   */
  getStats(flowId?: string) {
    const sql = flowId
      ? `SELECT status, COUNT(*) as count FROM tbl_context_history WHERE flow_id = ? GROUP BY status`
      : `SELECT status, COUNT(*) as count FROM tbl_context_history GROUP BY status`;

    const stmt = this.db.prepare(sql);
    const rows = flowId ? stmt.all(flowId) : stmt.all();

    const stats: Record<ContextStatus | string, number> = {};
    for (const row of rows as any[]) {
      stats[row.status] = row.count;
    }

    return {
      [ContextStatus.PENDING]: stats[ContextStatus.PENDING] ?? 0,
      [ContextStatus.RUNNING]: stats[ContextStatus.RUNNING] ?? 0,
      [ContextStatus.COMPLETED]: stats[ContextStatus.COMPLETED] ?? 0,
      [ContextStatus.MOVED]: stats[ContextStatus.MOVED] ?? 0,
      [ContextStatus.ERROR]: stats[ContextStatus.ERROR] ?? 0,
      [ContextStatus.DISCARDED]: stats[ContextStatus.DISCARDED] ?? 0,
    };
  }

  /**
   * 更新文件状态为已丢弃
   */
  discard(traceId: string) {
    const stmt = this.db.prepare(
      `UPDATE tbl_context_history SET status = '${ContextStatus.DISCARDED}', updated_at = strftime('%s', 'now') WHERE trace_id = ?`
    );
    stmt.run(traceId);
  }

  ensureFlow(flowId: string, flowName: string) {
    const stmt = this.db.prepare(`
      INSERT INTO tbl_flows (id, name, nodes_json, edges_json)
      VALUES (?, ?, '[]', '[]')
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, updated_at = strftime('%s', 'now')
    `);
    stmt.run(flowId, flowName);
  }

  /**
   * 增加重试计数
   */
  incrementRetry(traceId: string) {
    const stmt = this.db.prepare(
      'UPDATE tbl_context_history SET retry_count = retry_count + 1 WHERE trace_id = ?'
    );
    stmt.run(traceId);
  }

  getSetting(key: string): string | undefined {
    const stmt = this.db.prepare('SELECT value FROM tbl_settings WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row?.value;
  }

  setSetting(key: string, value: string) {
    const stmt = this.db.prepare(`
      INSERT INTO tbl_settings (key, value, updated_at)
      VALUES (?, ?, strftime('%s', 'now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    stmt.run(key, value);
  }

  getAllTags(): Array<{ id: number; name: string; target_path: string; description: string; created_at: number; updated_at: number }> {
    const stmt = this.db.prepare('SELECT * FROM tbl_tags ORDER BY updated_at DESC');
    return stmt.all() as any[];
  }

  getTagById(id: number): { id: number; name: string; target_path: string; description: string; created_at: number; updated_at: number } | undefined {
    const stmt = this.db.prepare('SELECT * FROM tbl_tags WHERE id = ?');
    return stmt.get(id) as any;
  }

  getTagByName(name: string): { id: number; name: string; target_path: string; description: string; created_at: number; updated_at: number } | undefined {
    const stmt = this.db.prepare('SELECT * FROM tbl_tags WHERE name = ?');
    return stmt.get(name) as any;
  }

  createTag(name: string, targetPath: string, description: string = ''): { id: number; name: string; target_path: string; description: string } {
    const stmt = this.db.prepare(
      `INSERT INTO tbl_tags (name, target_path, description) VALUES (@name, @targetPath, @description)`
    );
    const info = stmt.run({ name, targetPath, description });
    return { id: Number(info.lastInsertRowid), name, target_path: targetPath, description };
  }

  updateTag(id: number, name: string, targetPath: string, description: string = ''): boolean {
    const stmt = this.db.prepare(
      `UPDATE tbl_tags SET name = @name, target_path = @targetPath, description = @description, updated_at = strftime('%s', 'now') WHERE id = @id`
    );
    const info = stmt.run({ id, name, targetPath, description });
    return info.changes > 0;
  }

  deleteTag(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM tbl_tags WHERE id = @id');
    const info = stmt.run({ id });
    return info.changes > 0;
  }
}

export type DbInstance = InstanceType<typeof Database>;
