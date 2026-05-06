import { IFileContext } from './context';

/**
 * Tag 策略接口
 * 约定如何根据文件上下文生成 Tag
 *
 * V1 设计原则：
 * - 由于不涉及视频编解码，Tag 只能存在于 IFileContext 中，不写入文件二进制。
 * - Tag 是内存中的临时标记，用于节点间的数据传递和路径模板替换。
 *
 * 未来扩展（持久化）：
 * - 可扩展为将 Tag 写入 sidecar 文件（如 .json 或 .xml）。
 * - 可扩展为将 Tag 写入数据库或外部元数据服务。
 * - 持久化实现应实现此接口的 persist 方法（预留）。
 */
export interface ITagStrategy {
  /**
   * 根据文件上下文生成标签
   * @param ctx - 当前文件流转上下文
   * @returns 生成的标签数组
   */
  generate(ctx: IFileContext): string[];

  /**
   * （预留）持久化标签
   * 未来若需要将标签持久化到文件系统或数据库，可实现此方法。
   * @param ctx - 当前文件流转上下文
   * @param tags - 要持久化的标签
   */
  persist?(ctx: IFileContext, tags: string[]): Promise<void>;
}
