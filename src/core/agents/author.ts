import { createAgent, HumanMessage, toolStrategy } from 'langchain';
import { llm } from '@src/core/utils';
import z from 'zod';

export const AuthorOutput = z.object({
  description: z.string().describe('The concrete description of the project'),
  boldedWords: z
    .array(z.string())
    .describe('List of words to be bolded in the description'),
});

type AuthorOutputType = z.infer<typeof AuthorOutput>;

const systemMessage = `You are an HR expert that creates CV documents for IT professionals.
In these CVs the most important piece and your primary focus is to create a brief but concrete description of the project the user has worked on.
The description MUST meet the following criteria:
- you must not halucinate and stick to the user provided information
- it MUST NOT be longer than 5 sentences
- it MUST state what is the company and in which domain it operates
- it MUST state what is the concrete project for
- it MUST include concrete interesting challenges that are addressed such as performance, distributed systems, scalability, high load or managin and working with big data
- the tone of the description MUST be catchy and convincing as a sales pitch describing how hard, challenging and interesting project that was
- it MUST contain technology section in the end that lists applicable and used technologies in that project
- it MUST contain keywords section in the end that lists all important aspects such as domain, architecture type i.e microservices, monolith etc, type of work i.e digitalization, modernization, migration, etc

Also return which exact words would be good to be bolded in the description to highlight important aspects of the project.`;

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
