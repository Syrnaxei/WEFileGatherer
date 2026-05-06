/**
 * 简单的 Promise 并发队列
 * 用于限制同时处于流转状态的 IFileContext 数量
 */
type Task<T> = () => Promise<T>;

interface QueuedTask {
  task: Task<any>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

export class PromiseQueue {
  private concurrency: number;
  private running = 0;
  private queue: QueuedTask[] = [];

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  /**
   * 添加任务到队列，自动按并发限制调度执行
   */
  add<T>(task: Task<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  private process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }
    const { task, resolve, reject } = this.queue.shift()!;
    this.running++;
    task()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.running--;
        this.process();
      });
  }

  get size() {
    return this.queue.length;
  }

  get pending() {
    return this.running;
  }
}
