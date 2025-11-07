import { createAgent, HumanMessage, toolStrategy } from 'langchain';
import { llm } from '@src/core/llm';
import z from 'zod';
import { SHARED_PROMPT_ELEMENTS, CV_CONTEXT } from '@src/core/prompts/shared';

export const CritiqueOutput = z.object({
  justification: z
    .string()
    .describe(
      'Justification regarding the overall quality of the project description',
    ),
  contentScore: z
    .number()
    .min(0)
    .max(5)
    .describe(
      'Score representing the content quality of the project description',
    ),
});

type CritiqueOutputType = z.infer<typeof CritiqueOutput>;

const systemMessage = `You are an expert judge evaluating the quality of IT project descriptions for CVs.

${CV_CONTEXT}

Your task is to score the project description on how well it meets the requirements.

${SHARED_PROMPT_ELEMENTS.CORE_REQUIREMENTS}

${SHARED_PROMPT_ELEMENTS.EXPECTED_STRUCTURE}

${SHARED_PROMPT_ELEMENTS.QUALITY_CRITERIA}

**Scoring Criteria (1-10 scale):**
- Adherence to core requirements (no hallucination, proper structure)
- Technical depth and challenge description
- Business impact and value demonstration
- Professional tone and readability
- ATS keyword optimization`;

export const scoreDescription = async (
  projectDescription: string,
): Promise<CritiqueOutputType> => {
  const agent = createAgent({
    model: llm,
    responseFormat: toolStrategy(CritiqueOutput),
    systemPrompt: systemMessage,
  });

  const response = await agent.invoke({
    messages: [
      new HumanMessage(
        `Evaluate the following project description: ${projectDescription}`,
      ),
    ],
  });

  return response.structuredResponse;
};
