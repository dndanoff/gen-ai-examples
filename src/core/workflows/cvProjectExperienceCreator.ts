import { END, START, StateGraph } from '@langchain/langgraph';
import z from 'zod';

import { AuthorOutput, generateDescription } from '@src/core/agents/author';
import { reviewDescription, ReviewerOutput } from '@src/core/agents/reviewer';
import { EditorOutput, refinedDescription } from '@src/core/agents/editor';
import { CritiqueOutput, scoreDescription } from '@src/core/agents/critique';

const WorkflowStateSchema = z.object({
  userDraft: z.string(),
  authorOutput: AuthorOutput,
  reviewerOutput: ReviewerOutput,
  editorOutput: EditorOutput,
  critiqueOutput: CritiqueOutput,
});

type WorkflowStateType = z.infer<typeof WorkflowStateSchema>;

const workflow = new StateGraph(WorkflowStateSchema)
  // Add nodes
  .addNode('generate', async (state: WorkflowStateType) => {
    return { authorOutput: await generateDescription(state.userDraft) };
  })
  .addNode('review', async (state: WorkflowStateType) => {
    return {
      reviewerOutput: await reviewDescription(state.authorOutput.description),
    };
  })
  .addNode('edit', async (state: WorkflowStateType) => {
    return {
      editorOutput: await refinedDescription(
        state.authorOutput.description,
        state.reviewerOutput.overallReview,
        state.reviewerOutput.improvements,
      ),
    };
  })
  .addNode('score', async (state: WorkflowStateType) => {
    return {
      scoreOutput: await scoreDescription(
        state.editorOutput.refinedDescription,
      ),
    };
  })
  // Add edges
  .addEdge(START, 'generate')
  .addEdge('generate', 'review')
  .addEdge('review', 'edit')
  .addEdge('edit', 'score')
  .addEdge('score', END);

export const app = workflow.compile();
