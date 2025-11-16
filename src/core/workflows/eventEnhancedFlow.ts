import { StateGraph } from '@langchain/langgraph';
import EventEmitter from 'events';

export type NodeEvent = {
  type: string;
  nodeId: string;
  timestamp: number;
  sessionId?: string;
  data?: any;
};

export type NodeStartEvent = NodeEvent & {
  type: "node_start";
  data: { beforeState: any };
};

export type NodeEndEvent = NodeEvent & {
  type: "node_end";
  duration: number;
} & ({ status: 'success'; data: { afterState: any } } | { status: 'error'; data: { error: any } });

export type GraphDto = {
  nodes: NodeDto[];
  edges: EdgeDto[];
};

export type NodeDto = string;

export type EdgeDto = {
  from: string;
  to: string;
  isConditional: boolean;
};

export class EventEmittingStateGraph<T> extends StateGraph<T> {
  private readonly eventEmitter = new EventEmitter();
  private readonly nodeStartTimes: Map<string, number> = new Map();
  private readonly conditionalEdged: Record<string, string[]> = {};

  // Override addNode to intercept all calls and add event tracking
  addNode(...args: any[]): any {
    // Handle map of nodes (first overload)
    if (
      args.length === 1 &&
      typeof args[0] === 'object' &&
      args[0] !== null &&
      !Array.isArray(args[0])
    ) {
      const nodeMap = args[0];
      const wrappedNodeMap: Record<string, any> = {};

      for (const [nodeId, nodeFn] of Object.entries(nodeMap)) {
        wrappedNodeMap[nodeId] = this.wrapNodeFunction(nodeId, nodeFn) as any;
      }

      return (super.addNode as any)(wrappedNodeMap);
    }

    // Handle single node (second overload)
    const [nodeId, nodeFunction, metadata] = args;
    const wrappedFunction = this.wrapNodeFunction(nodeId, nodeFunction) as any;

    if (metadata !== undefined) {
      return (super.addNode as any)(nodeId, wrappedFunction, metadata);
    } else {
      return (super.addNode as any)(nodeId, wrappedFunction);
    }
  }

  /**
   * Add conditional edges with explicit outcome validation.
   * @param source - The source node
   * @param condition - Function that returns the target node or a key to map via pathMap
   * @param outcomes - Array of valid target nodes (mandatory)
   * @param pathMap - Optional mapping from condition return values to target nodes
   */
  addConditionalEdges(...args: any[]): any {
    // Extract parameters
    const [source, condition, outcomes, pathMap] = args;

    // Validate that outcomes is provided
    if (!outcomes || !Array.isArray(outcomes)) {
      throw new Error(
        'addConditionalEdges requires a third parameter: outcomes array of valid target nodes',
      );
    }

    // Validate pathMap if provided
    if (pathMap && typeof pathMap === 'object') {
      for (const [key, value] of Object.entries(pathMap)) {
        if (!outcomes.includes(value)) {
          throw new Error(
            `Invalid pathMap: '${key}' maps to '${value}' which is not in outcomes [${outcomes.join(', ')}]`,
          );
        }
      }
    }
    this.conditionalEdged[source] = outcomes;
    // Call parent's addConditionalEdges (without outcomes parameter)
    if (pathMap) {
      return (super.addConditionalEdges as any)(source, condition, pathMap);
    } else {
      return (super.addConditionalEdges as any)(source, condition);
    }
  }

  onNodeStart(listener: (event: NodeStartEvent) => void): this {
    this.eventEmitter.on('node_start', listener);
    return this;
  }

  onNodeEnd(listener: (event: NodeEndEvent) => void): this {
    this.eventEmitter.on('node_end', listener);
    return this;
  }

  generateMermaidGraph(): string {
    if (!this.compiled) {
      return 'Graph cannot be visualized as it is not compiled';
    }

    let graph = `graph TD\n`;
    graph += `__start__((start))\n`;
    graph += `__end__((end))\n`;

    for (const nodeId of Object.keys(this.nodes)) {
      graph += `${nodeId}[${nodeId}]\n`;
    }

    for (const edge of this.allEdges) {
      graph += `${edge[0]} --> ${edge[1]}\n`;
    }

    for (const [source, outcomes] of Object.entries(this.conditionalEdged)) {
      for (const outcome of outcomes) {
        graph += `${source} --> |conditional| ${outcome}\n`;
      }
    }

    return graph;
  }

  toGraphDto(): GraphDto {
    if (!this.compiled) {
      throw new Error('Graph must be compiled before building structure');
    }

    const nodes: string[] = [];
    const edges: EdgeDto[] = [];

    nodes.push('__start__', '__end__');
    Object.keys(this.nodes).forEach((nodeId) => {
      nodes.push(nodeId);
    });

    this.allEdges.forEach((edge) => {
      edges.push({
        from: edge[0],
        to: edge[1],
        isConditional: false,
      });
    });

    for (const [source, outcomes] of Object.entries(this.conditionalEdged)) {
      for (const outcome of outcomes) {
        edges.push({
          from: source,
          to: outcome,
          isConditional: true,
        });
      }
    }

    return { nodes, edges };
  }

  private wrapNodeFunction(nodeId: string, nodeFunction: any): any {
    return async (state: any, config?: any) => {
      const startTime = Date.now();
      this.nodeStartTimes.set(nodeId, startTime);

      // Extract sessionId from config.configurable
      const sessionId = config?.configurable?.sessionId;

      // Emit node start event
      this.eventEmitter.emit('node_start', {
        nodeId,
        type: 'node_start',
        timestamp: startTime,
        sessionId,
        data: { beforeState: state },
      } as NodeStartEvent);

      try {
        // Execute the original node function with config
        const result = await nodeFunction(state, config);

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Emit node end event
        this.eventEmitter.emit('node_end', {
          nodeId,
          type: 'node_end',
          timestamp: endTime,
          duration,
          sessionId,
          status: 'success',
          data: { afterState: { ...state, ...result } },
        } as NodeEndEvent);

        this.nodeStartTimes.delete(nodeId);
        return result;
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Emit node end event even on error
        this.eventEmitter.emit('node_end', {
          type: 'node_end',
          nodeId,
          timestamp: endTime,
          duration,
          sessionId,
          data: { error: error instanceof Error ? error.message : String(error) },
        } as NodeEndEvent);

        this.nodeStartTimes.delete(nodeId);
        throw error;
      }
    };
  }
}
