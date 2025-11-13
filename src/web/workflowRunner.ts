import { WebSocket } from 'ws';
import { workflowGraph, runWorkflow } from '@src/core/workflows/projectExperienceForCV';
import { NodeEndEvent, NodeStartEvent } from '@src/core/workflows/eventEnhancedFlow';

export interface WorkflowMessage {
  type: 'node_start' | 'node_end' | 'result' | 'error';
  data: any;
}

export class WorkflowRunner {
  private isRunning = false;

  constructor(
    private ws: WebSocket,
    private sessionId: string,
  ) { }

  async run(userDraft: string): Promise<void> {
    if (this.isRunning) {
      this.sendMessage({
        type: 'error',
        data: { message: 'Workflow is already running' },
      });
      return;
    }

    this.isRunning = true;

    try {
      // Set up event listeners with session filtering
      const nodeStartListener = (event: NodeStartEvent) => {
        // Only send events that match this session
        if (event.sessionId === this.sessionId) {
          this.sendMessage({
            type: 'node_start',
            data: {
              nodeId: event.nodeId,
              type: event.type,
              timestamp: event.timestamp,
              sessionId: event.sessionId,
              data: event.data,
            },
          });
        }
      };

      const nodeEndListener = (event: NodeEndEvent) => {
        // Only send events that match this session
        if (event.sessionId === this.sessionId) {
          this.sendMessage({
            type: 'node_end',
            data: {
              nodeId: event.nodeId,
              type: event.type,
              timestamp: event.timestamp,
              duration: event.duration,
              status: event.status,
              data: event.data,
              sessionId: event.sessionId,
            },
          });
        }
      };

      workflowGraph.onNodeStart(nodeStartListener);
      workflowGraph.onNodeEnd(nodeEndListener);

      // Run the workflow with session ID in config
      const result = await runWorkflow(userDraft, this.sessionId);

      // Send final result
      this.sendMessage({
        type: 'result',
        data: result,
      });
    } catch (error) {
      this.sendMessage({
        type: 'error',
        data: {
          message: error instanceof Error ? error.message : String(error),
        },
      });
    } finally {
      this.isRunning = false;
    }
  }

  private sendMessage(message: WorkflowMessage): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
