import { createAgent, HumanMessage, toolStrategy } from 'langchain';
import { llm } from '@src/core/utils';
import z from 'zod';

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

const systemMessage = `You are an expert critique of project descriptions in CVs of IT professionals.
Evaluate the following project description on a scale of 1-5 for content in accordance with the criteria:
The description MUST meet the following criteria:
- it MUST NOT be longer than 5 sentences
- it MUST state what is the company and in which domain it operates
- it MUST state what is the concrete project for
- it MUST include concrete interesting challenges that are addressed such as performance, distributed systems, scalability, high load or managin and working with big data
- the tone of the description MUST be catchy and convincing as a sales pitch describing how hard, challenging and interesting project that was
- it MUST contain technology section in the end that lists applicable and used technologies in that project
- it MUST contain keywords section in the end that lists all important aspects such as domain, architecture type i.e microservices, monolith etc, type of work i.e digitalization, modernization, migration, etc

Provide a brief justification.`;

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
