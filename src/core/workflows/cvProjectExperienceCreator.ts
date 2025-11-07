import { END, START, StateGraph } from '@langchain/langgraph';
import z from 'zod';

import { AuthorOutput, generateDescription } from '@src/core/agents/author';
import { reviewDescription, ReviewerOutput } from '@src/core/agents/reviewer';
import { EditorOutput, refinedDescription } from '@src/core/agents/editor';
import { CritiqueOutput, scoreDescription } from '@src/core/agents/critique';
import { log, withErrorHandling, withLogging } from '@src/utils';

const MAX_REVIEW_CYCLES = 2;
const MIN_ACCEPTABLE_SCORE = 4.0;

const WorkflowStateSchema = z.object({
  userDraft: z.string(),
  authorOutput: AuthorOutput,
  reviewerOutput: ReviewerOutput,
  editorOutput: EditorOutput,
  critiqueOutput: CritiqueOutput,
  reviewCycles: z.number().default(0),
});

type WorkflowStateType = z.infer<typeof WorkflowStateSchema>;

const workflow = new StateGraph(WorkflowStateSchema)
  // Add nodes
  .addNode('generate', async (state: WorkflowStateType) => {
    if (!state.userDraft) {
      throw new Error('userDraft is missing');
    }
    return {
      authorOutput: await withErrorHandling(withLogging(generateDescription))(
        state.userDraft,
      ),
    };
  })
  .addNode('review', async (state: WorkflowStateType) => {
    const descriptionToReview =
      state.editorOutput?.refinedDescription || state.authorOutput?.description;

    if (!descriptionToReview) {
      throw new Error('No description available for review');
    }

    return {
      reviewerOutput: await withErrorHandling(withLogging(reviewDescription))(
        descriptionToReview,
      ),
    };
  })
  .addNode('edit', async (state: WorkflowStateType) => {
    if (!state.authorOutput?.description) {
      throw new Error('authorOutput.description is missing');
    }

    if (!state.reviewerOutput) {
      throw new Error('reviewerOutput is missing');
    }

    return {
      editorOutput: await withErrorHandling(withLogging(refinedDescription))(
        state.authorOutput.description,
        state.reviewerOutput.overallReview,
        state.reviewerOutput.improvements,
      ),
    };
  })
  .addNode('score', async (state: WorkflowStateType) => {
    if (!state.editorOutput?.refinedDescription) {
      throw new Error('editorOutput.refinedDescription is missing');
    }
    return {
      critiqueOutput: await withErrorHandling(withLogging(scoreDescription))(
        state.editorOutput.refinedDescription,
      ),
      reviewCycles: (state.reviewCycles ?? 0) + 1,
    };
  })
  // Add edges
  .addEdge(START, 'generate')
  .addEdge('generate', 'review')
  .addEdge('review', 'edit')
  .addEdge('edit', 'score')
  // Conditional edge from score: loop back or end
  .addConditionalEdges('score', (state: WorkflowStateType) => {
    const score = state.critiqueOutput?.contentScore ?? 0;
    const cycles = state.reviewCycles ?? 0;
    const shouldLoop =
      score < MIN_ACCEPTABLE_SCORE && cycles < MAX_REVIEW_CYCLES;
    log(
      `[workflow] Score: ${score}, Cycles: ${cycles}, Should loop: ${shouldLoop}`,
    );
    return shouldLoop ? 'review' : END;
  });

const app = workflow.compile();

export const runWorkflow = async (userDraft: string) => {
  let result = undefined;
  try {
    result = await app.invoke({ userDraft });
  } catch (err) {
    console.error('[workflow error]', err);
  }
  return result;
};
