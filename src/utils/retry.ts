/**
 * IO 错误分类
 */
export enum IOErrorType {
  /** 瞬时错误：可能由文件占用、网络断连等引起，可重试 */
  TRANSIENT = 'TRANSIENT',
  /** 致命错误：权限拒绝、磁盘满等，不应重试 */
  FATAL = 'FATAL',
  /** 未知错误 */
  UNKNOWN = 'UNKNOWN',
}

/**
 * 判断错误是否属于瞬时错误
 */
export function classifyIOError(error: any): IOErrorType {
  const code = error?.code;
  const message = error?.message?.toLowerCase() ?? '';

  // 瞬时错误码（Linux/Windows/Mac）
  const transientCodes = [
    'EBUSY',    // 资源忙或锁定
    'EAGAIN',   // 资源暂时不可用
    'ETIMEDOUT',// 连接超时
    'ECONNRESET',// 连接重置
    'EPIPE',    // 管道破裂
    'ENETUNREACH',// 网络不可达
    'ENOENT',   // 文件不存在（可能是网络驱动器临时断开）
  ];

  if (transientCodes.includes(code)) {
    return IOErrorType.TRANSIENT;
  }

  // 致命错误码
  const fatalCodes = [
    'EACCES',   // 权限拒绝
    'EPERM',    // 操作不允许
    'ENOSPC',   // 磁盘空间不足
    'EISDIR',   // 期望文件但得到目录
    'ENOTDIR',  // 期望目录但得到文件
  ];

  if (fatalCodes.includes(code)) {
    return IOErrorType.FATAL;
  }

  // 根据消息内容判断
  if (message.includes('locked') || message.includes('busy') || message.includes('timeout')) {
    return IOErrorType.TRANSIENT;
  }

  return IOErrorType.UNKNOWN;
}

/**
 * 重试配置选项
 */
export interface RetryOptions {
  /** 最大重试次数（默认 3） */
  maxRetries?: number;
  /** 初始延迟毫秒数（默认 1000） */
  baseDelay?: number;
  /** 最大延迟毫秒数（默认 30000） */
  maxDelay?: number;
  /** 退避乘数（默认 2，即指数退避） */
  backoffMultiplier?: number;
  /** 仅对瞬时错误重试（默认 true） */
  retryOnlyTransient?: boolean;
  /** 自定义重试判断函数 */
  shouldRetry?: (error: any, attempt: number) => boolean;
  /** 每次重试前的回调 */
  onRetry?: (error: any, attempt: number, nextDelay: number) => void;
}

/**
 * 异步重试包装器
 *
 * 使用示例：
 * const result = await withRetry(() => fs.copyFile(src, dest), { maxRetries: 3 });
 *
 * @param fn 要执行的异步函数
 * @param options 重试配置
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryOnlyTransient = true,
    shouldRetry,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // 最后一次尝试，直接抛出
      if (attempt === maxRetries) {
        break;
      }

      // 判断是否应该重试
      const errorType = classifyIOError(error);
      let retry = true;

      if (retryOnlyTransient && errorType === IOErrorType.FATAL) {
        retry = false;
      }

      if (shouldRetry && !shouldRetry(error, attempt)) {
        retry = false;
      }

      if (!retry) {
        throw error;
      }

      // 计算指数退避延迟
      const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt), maxDelay);

      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }

      console.log(`[Retry] attempt ${attempt + 1} failed (${errorType}), retry in ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
