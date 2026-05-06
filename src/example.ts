import { INode, NodeType, IMoverNodeConfig } from './core/node';

/**
 * 示例：实例化一个 MoverNode
 *
 * 此示例演示如何声明一个 MoverNode 并指定其 config。
 * handle 方法目前仅打印日志，实际移动逻辑将在后续阶段实现。
 */
const moverNode: INode<IMoverNodeConfig> = {
  id: 'mover-001',
  type: NodeType.Mover,
  config: {
    targetPathTemplate: '/output/{tag}/{filename}',
    overwrite: false,
  },
  async handle(ctx) {
    console.log(`[MoverNode] Moving ${ctx.currentPath} to template: ${this.config.targetPathTemplate}`);
    // TODO: 实现实际的路径模板解析与文件移动逻辑
    return ctx;
  },
};

export { moverNode };
