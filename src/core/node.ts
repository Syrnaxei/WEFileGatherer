import { IFileContext } from './context';

/**
 * 节点类型枚举
 */
export enum NodeType {
  /** 入口节点：监听目录文件变化 */
  Watcher = 'watcher',
  /** 打标节点：为文件生成标签 */
  Tagger = 'tagger',
  /** 移动节点：将文件移动到目标路径 */
  Mover = 'mover',
}

/**
 * 基础节点接口（泛型设计）
 * @template TConfig - 节点配置类型，由具体节点实现决定
 */
export interface INode<TConfig = unknown> {
  /** 节点唯一 ID，在工作流中必须唯一 */
  id: string;

  /** 节点类型，用于区分不同功能的节点 */
  type: NodeType;

  /** 节点配置，具体结构由节点类型决定 */
  config: TConfig;

  /**
   * 核心执行方法
   * @param ctx - 当前文件流转上下文
   * @returns 更新后的上下文，供下一个节点使用
   */
  handle(ctx: IFileContext): Promise<IFileContext>;
}

/**
 * WatcherNode 配置接口
 * 入口节点配置，用于监听指定目录的文件变化
 */
export interface IWatcherNodeConfig {
  /** 监听目录路径（绝对路径） */
  watchPath: string;

  /** 文件匹配正则表达式字符串，如 "*.mp4" 或 ".*\\.mp4$" */
  filePattern: string;
}

/**
 * Tag 生成规则枚举
 */
export enum TagGenerationRule {
  /** 使用 UUID 作为标签 */
  UUID = 'uuid',
  /** 使用正则从文件名中提取 */
  RegexExtract = 'regex_extract',
  /** 使用固定前缀 + 文件名 */
  FixedPrefix = 'fixed_prefix',
  /** 使用用户指定的 tag（从 metadata 中读取） */
  UserTag = 'user_tag',
}

/**
 * Tag 生成规则
 */
export interface ITagRule {
  /** 规则类型 */
  type: TagGenerationRule;
  /** 规则参数（根据类型不同，参数含义不同） */
  params?: Record<string, string>;
}

/**
 * TaggerNode 配置接口
 * 打标节点配置，用于为文件生成标签
 */
export interface ITaggerNodeConfig {
  /** Tag 生成规则列表 */
  rules: ITagRule[];
}

/**
 * MoverNode 配置接口
 * 移动节点配置，用于将文件移动到目标路径
 */
export interface IMoverNodeConfig {
  /**
   * 目标路径模板
   * 支持变量替换，如 /output/{tag}/{filename}
   * 可用变量：
   * - {filename}: 当前文件名
   * - {originalFilename}: 原始文件名
   * - {tag}: 标签（若多个标签，取第一个）
   * - {tag[n]}: 第 n 个标签（从 0 开始）
   * - {metadata.key}: 从 metadata 中取值
   */
  targetPathTemplate: string;

  /** 是否覆盖已存在的文件 */
  overwrite?: boolean;
}
