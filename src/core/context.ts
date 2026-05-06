/**
 * 文件流转上下文
 * 当一个文件进入工作流时，它需要携带此上下文，在节点间传递。
 */
export interface IFileContext {
  /** 唯一流转 ID，用于追踪文件在整个工作流中的生命周期 */
  traceId: string;

  /** 原始文件名（不含路径） */
  originalFileName: string;

  /** 原始文件路径（文件进入工作流时的绝对路径） */
  originalPath: string;

  /** 当前文件路径（随着移动节点执行会改变） */
  currentPath: string;

  /** 标签集合，由 TaggerNode 等节点添加，用于后续路径模板替换或分类 */
  tags: string[];

  /** 扩展元数据，用于节点间传递自定义数据 */
  metadata: Record<string, any>;
}
