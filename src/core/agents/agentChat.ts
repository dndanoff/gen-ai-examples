import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  createAgent,
} from 'langchain';
import { TavilySearch } from '@langchain/tavily';
import { llm } from '../llm';
import { config } from '@src/config';

const systemMessage = new SystemMessage(
  `You are a helpful AI assistant engaged in a simple chat with a user.
  You also have access to a web search tool to look up recent information on the web when needed.
  Use the tool when the user asks about recent events or information that may not be in your training data.`,
);
const webSearchTool = new TavilySearch({
  tavilyApiKey: config.ai.searchApiKey,
  maxResults: 1,
});

export const startChat = () => {
  const messages: BaseMessage[] = [systemMessage];

  const agent = createAgent({
    model: llm,
    tools: [webSearchTool],
  });

  return {
    say: async (text: string) => {
      messages.push(new HumanMessage(text));
      const resp = await agent.invoke({ messages });
      const message = resp.messages[resp.messages.length - 1];
      messages.push(message);
      return message.text;
    },
  };
};
