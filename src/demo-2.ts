import { START, END } from '@langchain/langgraph';
import z from 'zod';
import { EventEmittingStateGraph } from './core/workflows/eventEnhancedFlow';

const WorkflowStateSchema = z.object({
  messages: z.array(z.string()),
});

type WorkflowState = z.infer<typeof WorkflowStateSchema>;

const workflow = new EventEmittingStateGraph(WorkflowStateSchema);
workflow
  .addNode('first', async (state: WorkflowState) => {
    return { messages: [...state.messages, 'First node executed'] };
  })
  .addNode('second', async (state: WorkflowState) => {
    return { messages: [...state.messages, 'Second node executed'] };
  })
  .addNode('third', async (state: WorkflowState) => {
    return { messages: [...state.messages, 'Third node executed'] };
  })
  .addNode('forth', async (state: WorkflowState) => {
    return { messages: [...state.messages, 'Fourth node executed'] };
  })
  .addEdge(START, 'first')
  .addEdge('first', 'second')
  .addConditionalEdges('second', (_state: WorkflowState) => {
    if (new Date().getDay() % 2 === 0) {
      return 'third';
    }
    return 'forth';
  }, ['third', 'forth'])
  .addEdge('third', END)
  .addEdge('forth', END);

workflow.compile();
console.log(workflow.generateMermaidGraph());
