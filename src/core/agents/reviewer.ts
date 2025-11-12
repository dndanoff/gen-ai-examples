import { createAgent, HumanMessage, toolStrategy } from 'langchain';
import { llm } from '@src/core/llm';
import z from 'zod';
import { SHARED_PROMPT_ELEMENTS, CV_CONTEXT } from '@src/core/prompts/shared';

export const ReviewerOutput = z.object({
  overallReview: z
    .string()
    .describe('The overall review of the description of the project'),
  improvements: z
    .array(z.string())
    .describe('List of suggestions for improving the description'),
});

type ReviewerOutputType = z.infer<typeof ReviewerOutput>;

const systemMessage = `You are a senior technical recruiter and CV expert who reviews project descriptions for quality and effectiveness.

${CV_CONTEXT}

Your task is to review the provided project description and identify areas for improvement.

${SHARED_PROMPT_ELEMENTS.CORE_REQUIREMENTS}

${SHARED_PROMPT_ELEMENTS.EXPECTED_STRUCTURE}

${SHARED_PROMPT_ELEMENTS.QUALITY_CRITERIA}

**Review Focus Areas:**
- Accuracy and adherence to core requirements
- Technical depth vs readability balance
- Missing technical challenges or business impact
- Structure and flow improvements
- Keyword optimization for ATS systems`;

export const reviewDescription = async (
  descriptionDraft: string,
): Promise<ReviewerOutputType> => {
  const agent = createAgent({
    model: llm,
    responseFormat: toolStrategy(ReviewerOutput),
    systemPrompt: systemMessage,
  });

  const response = await agent.invoke({
    messages: [
      new HumanMessage(
        `Review this project description for a technical CV:

"${descriptionDraft}"

Evaluate and provide specific feedback on:
- Technical accuracy and depth
- Professional tone and readability
- Missing technical challenges or business impact
- ATS keyword optimization
- Structure and flow improvements

Identify concrete areas for enhancement.`,
      ),
    ],
  });
  return response.structuredResponse;
};
