import { END, START, StateGraph } from '@langchain/langgraph';
import z from 'zod';

import { AuthorOutput, generateDescription } from '@src/core/agents/author';
import { reviewDescription, ReviewerOutput } from '@src/core/agents/reviewer';
import { EditorOutput, refinedDescription } from '@src/core/agents/editor';
import { CritiqueOutput, scoreDescription } from '@src/core/agents/critique';
import { log, withErrorHandling, withLogging } from '@src/utils';
import { enhancePrompt, PromptEnhancerOutput } from '../agents/promptEnhancer';

const MAX_REVIEW_CYCLES = 2;
const MIN_ACCEPTABLE_SCORE = 4.0;

const WorkflowStateSchema = z.object({
  userDraft: z.string(),
  promptEnhancerOutput: PromptEnhancerOutput,
  authorOutput: AuthorOutput,
  reviewerOutput: ReviewerOutput,
  editorOutput: EditorOutput,
  critiqueOutput: CritiqueOutput,
  reviewCycles: z.number().default(0),
});

type WorkflowStateType = z.infer<typeof WorkflowStateSchema>;

const workflow = new StateGraph(WorkflowStateSchema)
  // Add nodes
  .addNode('enhancePrompt', async (state: WorkflowStateType) => {
    console.log('[workflow] Entering node: enhancePrompt');
    return {
      promptEnhancerOutput: await withErrorHandling(withLogging(enhancePrompt))(
        state.userDraft,
      ),
    };
  })
  .addNode('generate', async (state: WorkflowStateType) => {
    const input = state.promptEnhancerOutput?.enhancedPrompt || state.userDraft;

    if (!input) {
      throw new Error('Input is missing');
    }
    return {
      authorOutput: await withErrorHandling(withLogging(generateDescription))(
        state.promptEnhancerOutput.enhancedPrompt,
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
  .addEdge(START, 'enhancePrompt')
  .addEdge('enhancePrompt', 'generate')
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

const assessInputRelevance = (userDraft: string): number => {
  let score = 0;

  // Positive indicators (project-related)
  const positivePatterns = [
    /\b(developed|built|implemented|created|designed)\b/gi,
    /\b(project|application|system|platform|service)\b/gi,
    /\b(company|team|client|business)\b/gi,
    /\b(technology|framework|database|api)\b/gi,
  ];

  positivePatterns.forEach((pattern) => {
    const matches = userDraft.match(pattern);
    if (matches) score += matches.length;
  });

  // Negative indicators (suspicious content)
  const negativePatterns = [
    /ignore.*previous.*instruction/gi,
    /you are now/gi,
    /pretend/gi,
    /roleplay/gi,
  ];

  negativePatterns.forEach((pattern) => {
    if (pattern.test(userDraft)) score -= 10;
  });

  return Math.max(0, score);
};

const validateProjectDraft = (userDraft: string): boolean => {
  // Check for minimum requirements
  if (userDraft.length < 20 || userDraft.length > 2000) {
    return false;
  }

  // Must contain project-related keywords
  const projectKeywords = [
    'project',
    'developed',
    'built',
    'implemented',
    'created',
    'designed',
    'system',
    'application',
    'platform',
    'service',
    'technology',
    'feature',
  ];

  const hasProjectKeywords = projectKeywords.some((keyword) =>
    userDraft.toLowerCase().includes(keyword),
  );

  // Should not contain suspicious patterns
  const suspiciousPatterns = [
    /ignore.{1,20}instructions/i,
    /system.{1,20}prompt/i,
    /jailbreak/i,
    /pretend.{1,20}you.{1,20}are/i,
    /<script/i,
    /javascript:/i,
  ];

  const hasSuspiciousContent = suspiciousPatterns.some((pattern) =>
    pattern.test(userDraft),
  );

  const relevanceScore = assessInputRelevance(userDraft);
  return hasProjectKeywords && !hasSuspiciousContent && relevanceScore > 4;
};

export const runWorkflow = async (userDraft: string) => {
  if (!validateProjectDraft(userDraft)) {
    throw new Error('Invalid project description draft provided.');
  }

  let result = undefined;
  try {
    result = await app.invoke({ userDraft });
  } catch (err) {
    console.error('[workflow error]', err);
  }
  return result;
};
