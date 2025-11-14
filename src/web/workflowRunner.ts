import { WebSocket } from 'ws';
import { workflowGraph, runWorkflow } from '@src/core/workflows/projectExperienceForCV';
import { NodeEndEvent, NodeEvent, NodeStartEvent } from '@src/core/workflows/eventEnhancedFlow';

export class WorkflowRunner {
  private isRunning = false;

  constructor(
    private ws: WebSocket,
    private sessionId: string,
  ) { }

  async run(userDraft: string): Promise<void> {
    if (this.isRunning) {
      this.sendMessage({
        nodeId: '__start__',
        type: 'error',
        timestamp: new Date().getTime(),
        sessionId: this.sessionId,
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
          this.sendMessage(event);
        }
      };

      const nodeEndListener = (event: NodeEndEvent) => {
        // Only send events that match this session
        if (event.sessionId === this.sessionId) {
          this.sendMessage(event);
        }
      };

      workflowGraph.onNodeStart(nodeStartListener);
      workflowGraph.onNodeEnd(nodeEndListener);

      // Run the workflow with session ID in config
      const result = await runWorkflow(userDraft, this.sessionId);

      // Send final result
      this.sendMessage({
        nodeId: '__end__',
        type: 'completion',
        timestamp: new Date().getTime(),
        sessionId: this.sessionId,
        data: result,
      });
    } catch (error) {
      this.sendMessage({
        nodeId: '__end__',
        type: 'error',
        timestamp: new Date().getTime(),
        sessionId: this.sessionId,
        data: {
          message: error instanceof Error ? error.message : String(error),
        },
      });
    } finally {
      this.isRunning = false;
    }
  }

  private sendMessage(message: NodeEvent | NodeStartEvent | NodeEndEvent): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
