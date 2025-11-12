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
        `Transform this rough project draft into a compelling CV project description:

"${userDraft}"

Focus on:
- Extracting the core technical challenges and business impact
- Highlighting the most impressive technical aspects
- Creating an engaging narrative that showcases expertise
- Ensuring all factual information is preserved accurately

Generate a polished description with appropriate keywords for bolding.`,
      ),
    ],
  });

  return response.structuredResponse;
};
