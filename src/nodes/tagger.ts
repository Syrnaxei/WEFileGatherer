import { randomUUID } from 'crypto';
import { INode, NodeType, ITaggerNodeConfig, TagGenerationRule } from '../core/node';
import { IFileContext } from '../core/context';

/**
 * TaggerNode（打标节点）
 *
 * 职责：根据配置规则为文件生成 Tag，并附加到 ctx.tags。
 *
 * V1 原则：
 * - 仅修改内存中的 IFileContext，不涉及任何磁盘 IO
 * - 不涉及视频编解码
 */
export class TaggerNode implements INode<ITaggerNodeConfig> {
  id: string;
  type = NodeType.Tagger;
  config: ITaggerNodeConfig;

  constructor(id: string, config: ITaggerNodeConfig) {
    this.id = id;
    this.config = config;
  }

  async handle(ctx: IFileContext): Promise<IFileContext> {
    console.log(`[TaggerNode] Generating tags for traceId=${ctx.traceId}`);

    for (const rule of this.config.rules) {
      try {
        const tag = this.applyRule(rule, ctx);
        if (tag !== null && tag !== undefined && tag !== '' && !ctx.tags.includes(tag)) {
          ctx.tags.push(tag);
          console.log(`[TaggerNode] Added tag: "${tag}"`);
        }
      } catch (err: any) {
        console.error(`[TaggerNode] Rule ${rule.type} failed: ${err.message}`);
        // 单个规则失败不影响其他规则执行
      }
    }

    console.log(`[TaggerNode] All tags: [${ctx.tags.join(', ')}]`);
    return ctx;
  }

  /**
   * 根据规则类型生成 Tag
   */
  private applyRule(rule: ITaggerNodeConfig['rules'][0], ctx: IFileContext): string | null {
    switch (rule.type) {
      case TagGenerationRule.UUID: {
        return randomUUID();
      }

      case TagGenerationRule.RegexExtract: {
        const pattern = rule.params?.pattern;
        if (!pattern) {
          console.warn('[TaggerNode] RegexExtract rule missing "pattern" param');
          return null;
        }
        const regex = new RegExp(pattern);
        // 优先从原始文件名匹配，再从完整路径匹配
        const match = regex.exec(ctx.originalFileName) || regex.exec(ctx.originalPath);
        if (match) {
          // 如果有捕获组，返回第一个捕获组；否则返回整个匹配
          return match[1] ?? match[0];
        }
        console.log(`[TaggerNode] RegexExtract: no match for pattern "${pattern}"`);
        return null;
      }

      case TagGenerationRule.FixedPrefix: {
        const prefix = rule.params?.prefix ?? '';
        return `${prefix}${ctx.originalFileName}`;
      }

      case TagGenerationRule.UserTag: {
        // 从 metadata 中读取用户指定的 tag
        const userTag = ctx.metadata?.userTag;
        if (userTag && typeof userTag === 'string' && userTag.trim() !== '') {
          return userTag.trim();
        }
        console.log('[TaggerNode] No user_tag found in metadata');
        return null;
      }

      default:
        console.warn(`[TaggerNode] Unknown rule type: ${(rule as any).type}`);
        return null;
    }
  }
}
