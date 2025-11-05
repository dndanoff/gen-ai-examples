import { createAgent, HumanMessage, toolStrategy } from 'langchain';
import { llm } from '@src/core/utils';
import z from 'zod';

export const ReviewerOutput = z.object({
  overallReview: z
    .string()
    .describe('The overall review of the description of the project'),
  improvements: z
    .array(z.string())
    .describe('List of suggestions for improving the description'),
});

type ReviewerOutputType = z.infer<typeof ReviewerOutput>;

const systemMessage = `You are a senior HR expert that works on CV documents for IT professionals.
Your task is to perform a thorough review of a project description that will be part of a CV.
Analyze the text for the following aspects:
- it MUST NOT be longer than 5 sentences
- it MUST state what is the company and in which domain it operates
- it MUST state what is the concrete project for
- it MUST include concrete interesting challenges that are addressed such as performance, distributed systems, scalability, high load or managin and working with big data
- the tone of the description MUST be catchy and convincing as a sales pitch describing how hard, challenging and interesting project that was
- it MUST contain technology section in the end that lists applicable and used technologies in that project
- it MUST contain keywords section in the end that lists all important aspects such as domain, architecture type i.e microservices, monolith etc, type of work i.e digitalization, modernization, migration, etc

Provide a structured review with specific, actionable suggestions.`;

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
        `Review according to your instructions the following description which will be used in a CV describing project experience: ${descriptionDraft}`,
      ),
    ],
  });
  console.log("Test");
  return response.structuredResponse;
};
