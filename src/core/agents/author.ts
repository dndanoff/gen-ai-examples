import { createAgent, HumanMessage, toolStrategy } from 'langchain';
import { llm } from '@src/core/llm';
import z from 'zod';
import { SHARED_PROMPT_ELEMENTS, CV_CONTEXT } from '@src/core/prompts/shared';

export const AuthorOutput = z.object({
  description: z.string().describe('The concrete description of the project'),
  boldedWords: z
    .array(z.string())
    .describe('List of words to be bolded in the description'),
});

type AuthorOutputType = z.infer<typeof AuthorOutput>;

const systemMessage = `You are an HR expert specializing in creating compelling CV project descriptions for IT professionals.

${CV_CONTEXT}

Your task is to transform the user's rough project draft into a polished, professional description.

${SHARED_PROMPT_ELEMENTS.CORE_REQUIREMENTS}

${SHARED_PROMPT_ELEMENTS.EXPECTED_STRUCTURE}

${SHARED_PROMPT_ELEMENTS.QUALITY_CRITERIA}

**Additional Author Instructions:**
- Return both the polished description and a list of key terms that should be bolded for emphasis
- Focus on making the content engaging and sales-pitch like`;

export const generateDescription = async (
  userDraft: string,
): Promise<AuthorOutputType> => {
  const agent = createAgent({
    model: llm,
    responseFormat: toolStrategy(AuthorOutput),
    systemPrompt: systemMessage,
  });

  const response = await agent.invoke({
    messages: [
      new HumanMessage(
        `Use the following user draft and rough description to generate the respective project description that follows the criteria: ${userDraft}`,
      ),
    ],
  });

  return response.structuredResponse;
};
