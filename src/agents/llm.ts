import { ChatOpenAI } from '@langchain/openai';
import { config } from '@src/config';

export const llm = new ChatOpenAI({
  model: config.ai.model,
  apiKey: config.ai.apiKey,
  temperature: 0.2,
  configuration: {
    baseURL: config.ai.baseUrl,
  },
});
