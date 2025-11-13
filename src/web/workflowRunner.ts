import { WebSocket } from 'ws';
import { workflowGraph, runWorkflow } from '@src/core/workflows/projectExperienceForCV';

export interface WorkflowMessage {
  type: 'node_start' | 'node_end' | 'result' | 'error';
  data: any;
}

export class WorkflowRunner {
  private isRunning = false;

  constructor(private ws: WebSocket) {}

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
      // Set up event listeners
      const nodeStartListener = (event: any) => {
        this.sendMessage({
          type: 'node_start',
          data: {
            nodeId: event.nodeId,
            type: event.type,
            timestamp: event.timestamp,
          },
        });
      };

      const nodeEndListener = (event: any) => {
        this.sendMessage({
          type: 'node_end',
          data: {
            nodeId: event.nodeId,
            type: event.type,
            timestamp: event.timestamp,
            duration: event.duration,
            status: event.status,
            error: event.error,
          },
        });
      };

      workflowGraph.onNodeStart(nodeStartListener);
      workflowGraph.onNodeEnd(nodeEndListener);

      // Run the workflow
      const result = await runWorkflow(userDraft);

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
