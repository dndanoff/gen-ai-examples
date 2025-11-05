import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  createAgent,
} from 'langchain';

import { llm } from '../utils';
import { WebSearchTool } from './webSearchTool';

const systemMessage = new SystemMessage(
  `You are a helpful AI assistant engaged in a simple chat with a user.
  You also have access to a web search tool to look up recent information on the web when needed.
  Use the tool when the user asks about recent events or information that may not be in your training data.`,
);
const webSearchTool = new WebSearchTool({ fetchArticleContent: false });

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
