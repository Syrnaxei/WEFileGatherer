import type { Node, Edge } from 'reactflow';

/**
 * 后端 IFlow 的数据结构（与后端接口对齐）
 */
export interface BackendFlow {
  id: string;
  name: string;
  nodes: BackendNode[];
  edges: BackendEdge[];
}

export interface BackendNode {
  id: string;
  type: string;
  config: unknown;
}

export interface BackendEdge {
  sourceId: string;
  targetId: string;
}

/**
 * 前端 React Flow Node 的 data 结构
 */
export interface FlowNodeData {
  label: string;
  config: unknown;
}

/**
 * 后端 -> 前端：将后端 IFlow 转换为 React Flow 的 nodes 和 edges
 */
export function backendToFrontend(flow: BackendFlow): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = flow.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: (n.config as any).__position ?? { x: 0, y: 0 },
    data: {
      label: n.type.toUpperCase(),
      config: n.config,
    },
  }));

  const edges: Edge[] = flow.edges.map((e, idx) => ({
    id: `e-${e.sourceId}-${e.targetId}-${idx}`,
    source: e.sourceId,
    target: e.targetId,
    type: 'smoothstep',
  }));

  return { nodes, edges };
}

/**
 * 前端 -> 后端：将 React Flow 的 nodes 和 edges 转换为后端 IFlow
 */
export function frontendToBackend(
  id: string,
  name: string,
  nodes: Node[],
  edges: Edge[]
): BackendFlow {
  return {
    id,
    name,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type!,
      config: {
        ...(n.data?.config as Record<string, any> ?? {}),
        __position: n.position,
      },
    })),
    edges: edges.map((e) => ({
      sourceId: e.source,
      targetId: e.target,
    })),
  };
}
