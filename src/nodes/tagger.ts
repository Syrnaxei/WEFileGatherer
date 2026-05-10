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
    console.log(`[TaggerNode] ${ctx.originalFileName} → tagging`);

    for (const rule of this.config.rules) {
      try {
        const tag = this.applyRule(rule, ctx);
        if (tag !== null && tag !== undefined && tag !== '' && !ctx.tags.includes(tag)) {
          ctx.tags.push(tag);
          console.log(`[TaggerNode] ${ctx.originalFileName} tagged: "${tag}"`);
        }
      } catch (err: any) {
        console.error(`[TaggerNode] ${ctx.originalFileName} error: rule ${rule.type} failed: ${err.message}`);
      }
    }

    console.log(`[TaggerNode] ${ctx.originalFileName} ← tags: [${ctx.tags.join(', ')}]`);
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
          console.warn(`[TaggerNode] ${ctx.originalFileName} warn: RegexExtract missing "pattern"`);
          return null;
        }
        const regex = new RegExp(pattern);
        const match = regex.exec(ctx.originalFileName) || regex.exec(ctx.originalPath);
        if (match) {
          return match[1] ?? match[0];
        }
        return null;
      }

      case TagGenerationRule.FixedPrefix: {
        const prefix = rule.params?.prefix ?? '';
        return `${prefix}${ctx.originalFileName}`;
      }

      case TagGenerationRule.UserTag: {
        const userTag = ctx.metadata?.userTag;
        if (userTag && typeof userTag === 'string' && userTag.trim() !== '') {
          return userTag.trim();
        }
        return null;
      }

      default:
        console.warn(`[TaggerNode] ${ctx.originalFileName} warn: unknown rule type ${(rule as any).type}`);
        return null;
    }
  }
}
