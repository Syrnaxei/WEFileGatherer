import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import { IFlow } from './flow';
import { INode } from './node';
import { IFileContext } from './context';
import { PromiseQueue } from '../utils/queue';
import { SQLiteDb, ContextStatus } from '../db/sqlite';

export class FlowRunner extends EventEmitter {
  private flow: IFlow;
  private adjacencyMap = new Map<string, string[]>();
  private nodeMap = new Map<string, INode>();
  private queue: PromiseQueue;
  private entryNodeId: string;
  private db: SQLiteDb;
  private isRunning = false;
  private totalFiles = 0;
  private completedFiles = 0;
  private fileSizeCache = new Map<string, string>();

  constructor(flow: IFlow, concurrency: number = 5) {
    super();
    this.flow = flow;
    this.queue = new PromiseQueue(concurrency);
    this.db = SQLiteDb.getInstance();

    for (const node of flow.nodes) {
      this.nodeMap.set(node.id, node);
    }

    this.buildAdjacency();
    this.entryNodeId = this.resolveEntryNode();
  }

  get running() {
    return this.isRunning;
  }

  get flowId() {
    return this.flow.id;
  }

  setTotalFiles(count: number) {
    this.totalFiles = count;
    this.completedFiles = 0;
  }

  private getProgress(): string {
    if (this.totalFiles <= 0) return '';
    const pct = Math.round((this.completedFiles / this.totalFiles) * 100);
    return `${this.completedFiles}/${this.totalFiles} (${pct}%)`;
  }

  async enqueue(ctx: IFileContext): Promise<void> {
    this.db.upsertContext({
      traceId: ctx.traceId,
      flowId: this.flow.id,
      status: ContextStatus.PENDING,
      originalFileName: ctx.originalFileName,
      originalPath: ctx.originalPath,
      currentPath: ctx.currentPath,
      tags: ctx.tags,
      metadata: ctx.metadata,
    });

    const fileSize = await this.getFileSizeMB(ctx.currentPath);
    this.fileSizeCache.set(ctx.traceId, fileSize);

    this.emit('log', {
      event: 'enqueue',
      fileName: ctx.originalFileName,
      fileSize,
      traceId: ctx.traceId,
      progress: this.getProgress(),
      message: `${ctx.originalFileName} ${fileSize}MB start`,
      ctx: this.snapshot(ctx),
    });

    await this.queue.add(() => this.executeSingle(ctx));
  }

  getStats() {
    return this.db.getStats(this.flow.id);
  }

  private async getFileSizeMB(filePath: string): Promise<string> {
    try {
      const stat = await fs.stat(filePath);
      return (stat.size / (1024 * 1024)).toFixed(2);
    } catch {
      return '?';
    }
  }

  private buildAdjacency() {
    for (const edge of this.flow.edges) {
      if (!this.adjacencyMap.has(edge.sourceId)) {
        this.adjacencyMap.set(edge.sourceId, []);
      }
      this.adjacencyMap.get(edge.sourceId)!.push(edge.targetId);
    }
  }

  private resolveEntryNode(): string {
    const allTargetIds = new Set(this.flow.edges.map((e) => e.targetId));
    const candidates = this.flow.nodes.filter((n) => !allTargetIds.has(n.id));

    if (candidates.length === 0) {
      throw new Error('Flow validation failed: no entry node found');
    }
    if (candidates.length > 1) {
      throw new Error(
        `Flow validation failed: expected 1 entry node, found ${candidates.length}`
      );
    }

    return candidates[0].id;
  }

  private async executeSingle(initialCtx: IFileContext): Promise<IFileContext> {
    let ctx = initialCtx;
    let currentNodeId: string | undefined = this.entryNodeId;
    const fileSize = this.fileSizeCache.get(ctx.traceId) ?? '?';

    try {
      while (currentNodeId) {
        const node = this.nodeMap.get(currentNodeId);
        if (!node) {
          throw new Error(`Node ${currentNodeId} not found in flow`);
        }

        this.db.upsertContext({
          traceId: ctx.traceId,
          flowId: this.flow.id,
          status: ContextStatus.RUNNING,
          originalFileName: ctx.originalFileName,
          originalPath: ctx.originalPath,
          currentPath: ctx.currentPath,
          tags: ctx.tags,
          metadata: ctx.metadata,
          currentNodeId: node.id,
        });

        this.emit('log', {
          event: 'node_start',
          nodeId: node.id,
          nodeType: node.type,
          fileName: ctx.originalFileName,
          fileSize,
          traceId: ctx.traceId,
          progress: this.getProgress(),
          message: `${ctx.originalFileName} ${fileSize}MB → ${node.type} [${this.getProgress()}]`,
          ctx: this.snapshot(ctx),
        });

        ctx = await node.handle(ctx);

        this.db.upsertContext({
          traceId: ctx.traceId,
          flowId: this.flow.id,
          status: ContextStatus.RUNNING,
          originalFileName: ctx.originalFileName,
          originalPath: ctx.originalPath,
          currentPath: ctx.currentPath,
          tags: ctx.tags,
          metadata: ctx.metadata,
          currentNodeId: node.id,
        });

        this.emit('log', {
          event: 'node_complete',
          nodeId: node.id,
          nodeType: node.type,
          fileName: ctx.originalFileName,
          fileSize,
          traceId: ctx.traceId,
          progress: this.getProgress(),
          message: `${ctx.originalFileName} ${fileSize}MB ← ${node.type} [${this.getProgress()}]`,
          ctx: this.snapshot(ctx),
        });

        if (node.type === 'mover') {
          this.db.upsertContext({
            traceId: ctx.traceId,
            flowId: this.flow.id,
            status: ContextStatus.MOVED,
            originalFileName: ctx.originalFileName,
            originalPath: ctx.originalPath,
            currentPath: ctx.currentPath,
            tags: ctx.tags,
            metadata: ctx.metadata,
            currentNodeId: node.id,
          });
        }

        const nextIds: string[] = this.adjacencyMap.get(currentNodeId) ?? [];
        if (nextIds.length === 0) {
          this.completedFiles++;

          this.db.upsertContext({
            traceId: ctx.traceId,
            flowId: this.flow.id,
            status: ContextStatus.COMPLETED,
            originalFileName: ctx.originalFileName,
            originalPath: ctx.originalPath,
            currentPath: ctx.currentPath,
            tags: ctx.tags,
            metadata: ctx.metadata,
          });

          this.emit('log', {
            event: 'flow_complete',
            fileName: ctx.originalFileName,
            fileSize,
            traceId: ctx.traceId,
            progress: this.getProgress(),
            message: `${ctx.originalFileName} done. [${this.getProgress()}]`,
            ctx: this.snapshot(ctx),
          });
          break;
        }

        if (nextIds.length > 1) {
          console.warn(
            `[FlowRunner] Branching detected at ${currentNodeId}, V1 follows first edge only`
          );
        }

        currentNodeId = nextIds[0];
      }
    } catch (err: any) {
      this.completedFiles++;

      ctx.metadata._error = err.message;
      ctx.metadata._errorNodeId = currentNodeId;

      this.db.upsertContext({
        traceId: ctx.traceId,
        flowId: this.flow.id,
        status: ContextStatus.ERROR,
        originalFileName: ctx.originalFileName,
        originalPath: ctx.originalPath,
        currentPath: ctx.currentPath,
        tags: ctx.tags,
        metadata: ctx.metadata,
        currentNodeId,
        errorMessage: err.message,
      });

      this.emit('log', {
        event: 'error',
        nodeId: currentNodeId,
        error: err.message,
        fileName: ctx.originalFileName,
        fileSize,
        traceId: ctx.traceId,
        progress: this.getProgress(),
        message: `${ctx.originalFileName} error: ${err.message}`,
        ctx: this.snapshot(ctx),
      });
    }

    return ctx;
  }

  private snapshot(ctx: IFileContext): IFileContext {
    return {
      traceId: ctx.traceId,
      originalFileName: ctx.originalFileName,
      originalPath: ctx.originalPath,
      currentPath: ctx.currentPath,
      tags: [...ctx.tags],
      metadata: { ...ctx.metadata },
    };
  }
}
