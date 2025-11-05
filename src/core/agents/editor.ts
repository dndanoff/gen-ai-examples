import { createAgent, HumanMessage, toolStrategy } from 'langchain';
import { llm } from '@src/core/utils';
import z from 'zod';

export const EditorOutput = z.object({
  refinedDescription: z
    .string()
    .describe('The concrete description of the project'),
  boldedWords: z
    .array(z.string())
    .describe('List of words to be bolded in the description'),
});

type EditorOutputType = z.infer<typeof EditorOutput>;

const systemMessage = `You are a senior HR expert that refines CV documents for IT professionals.
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
