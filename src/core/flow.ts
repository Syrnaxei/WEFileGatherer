import { INode } from './node';
import { IFileContext } from './context';

/**
 * 边（连接）接口
 * 表示工作流中节点之间的数据流向
 */
export interface IEdge {
  /** 源节点 ID（数据流出方） */
  sourceId: string;

  /** 目标节点 ID（数据流入方） */
  targetId: string;
}

/**
 * 工作流模型
 * 节点的集合及它们之间的连接关系
 */
export interface IFlow {
  /** 工作流唯一 ID */
  id: string;

  /** 工作流名称 */
  name: string;

  /** 节点实例列表 */
  nodes: INode[];

  /** 边列表，用于表示数据流向 */
  edges: IEdge[];

  /**
   * 【思考题】Runner 如何根据 Edge 列表确定下一个要执行的 Node？
   *
   * 1. 构建邻接表：遍历 edges 数组，以 sourceId 为 key，targetId 数组为 value，
   *    构建有向图（DAG）结构。时间复杂度 O(E)。
   *
   * 2. 确定入口节点：找到没有入边的节点（或 type 为 Watcher 的节点）作为起点。
   *    一个合法的 Flow 应有且仅有一个入口节点（V1 约束）。
   *
   * 3. 顺序执行：Runner 从入口节点开始执行，执行完毕后根据当前节点的 id
   *    在邻接表中查找所有 targetId。由于 V1 先支持线性管道，通常只有一个 targetId。
   *
   * 4. 分支处理（未来扩展）：若一个节点有多个出边，可并行执行多个下游节点。
   *    每个分支应携带 IFileContext 的深拷贝，避免节点间副作用干扰。
   *
   * 5. 合并处理（未来扩展）：若多个节点指向同一个目标节点，需定义汇合策略：
   *    - "all"：全部上游节点执行完毕后触发；
   *    - "any"：任意上游节点到达即触发（携带先到的上下文）。
   *    V1 可先不支持复杂 DAG，仅支持线性链。
   */
}

/**
 * 工作流执行器接口（预留）
 * 负责根据 IFlow 定义驱动节点执行
 */
export interface IFlowRunner {
  /**
   * 执行工作流
   * @param flow - 要执行的工作流
   * @param initialContext - 初始文件上下文
   * @returns 最终处理后的上下文
   */
  execute(flow: IFlow, initialContext: IFileContext): Promise<IFileContext>;
}
