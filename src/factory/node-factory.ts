import { INode, NodeType, IWatcherNodeConfig, ITaggerNodeConfig, IMoverNodeConfig } from '../core/node';
import { WatcherNode } from '../nodes/watcher';
import { TaggerNode } from '../nodes/tagger';
import { MoverNode } from '../nodes/mover';

/**
 * 节点工厂
 *
 * 后端 API 接收到前端传来的 Flow JSON 后，不能直接拿纯 JSON 去跑。
 * 必须根据 JSON 中的 type 字段，实例化真正的 WatcherNode/TaggerNode/MoverNode 类对象。
 */
export class NodeFactory {
  /**
   * 根据序列化后的节点数据创建真实节点实例
   * @param data 前端传来的节点数据（包含 id, type, config）
   */
  static create(data: { id: string; type: string; config: unknown }): INode {
    switch (data.type) {
      case NodeType.Watcher:
        return new WatcherNode(data.id, data.config as IWatcherNodeConfig);
      case NodeType.Tagger:
        return new TaggerNode(data.id, data.config as ITaggerNodeConfig);
      case NodeType.Mover:
        return new MoverNode(data.id, data.config as IMoverNodeConfig);
      default:
        throw new Error(`Unknown node type: ${data.type}`);
    }
  }

  /**
   * 批量创建节点实例（用于从 IFlow JSON 还原可执行对象）
   */
  static createAll(nodes: Array<{ id: string; type: string; config: unknown }>): INode[] {
    return nodes.map((n) => this.create(n));
  }
}
