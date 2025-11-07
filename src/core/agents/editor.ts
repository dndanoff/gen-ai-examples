import { createAgent, HumanMessage, toolStrategy } from 'langchain';
import { llm } from '@src/core/llm';
import z from 'zod';
import { SHARED_PROMPT_ELEMENTS, CV_CONTEXT } from '@src/core/prompts/shared';

export const EditorOutput = z.object({
  refinedDescription: z
    .string()
    .describe('The concrete description of the project'),
  boldedWords: z
    .array(z.string())
    .describe('List of words to be bolded in the description'),
});

type EditorOutputType = z.infer<typeof EditorOutput>;

const systemMessage = `You are a professional editor specializing in polishing IT project descriptions for CVs.

${CV_CONTEXT}

Your task is to refine the project description based on reviewer feedback while maintaining all original information.

${SHARED_PROMPT_ELEMENTS.CORE_REQUIREMENTS}

${SHARED_PROMPT_ELEMENTS.EXPECTED_STRUCTURE}

${SHARED_PROMPT_ELEMENTS.QUALITY_CRITERIA}

**Editing Guidelines:**
- Apply reviewer suggestions without changing factual content
- Improve clarity, flow, and impact
- Ensure technical terminology is used correctly
- Maintain the engaging, professional tone`;

export const refinedDescription = async (
  descriptionDraft: string,
  overallReview: string,
  improvements: string[],
): Promise<EditorOutputType> => {
  const agent = createAgent({
    model: llm,
    responseFormat: toolStrategy(EditorOutput),
    systemPrompt: systemMessage,
  });

  const response = await agent.invoke({
    messages: [
      new HumanMessage(`You have the original description draft: ${descriptionDraft}.
Reviewer also provided to you the following overall review of the description: ${overallReview}.
Additionally, you have the following suggestions for improving the description:
${improvements.map((i) => `- ${i}`).join(`\n`)}

Revise the original description draft according to the review and the suggestions and produce the final refined description.`),
    ],
  });

  return response.structuredResponse;
};
