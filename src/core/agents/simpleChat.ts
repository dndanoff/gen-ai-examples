import { BaseMessage, HumanMessage, SystemMessage } from 'langchain';
import { llm } from '@src/core/utils';

const systemMessage = new SystemMessage(
  'You are a helpful AI assistant engaged in a simple chat with a user.',
);

export const startChat = () => {
  const messages: BaseMessage[] = [systemMessage];

  return {
    say: async (text: string) => {
      messages.push(new HumanMessage(text));
      const resp = await llm.invoke(messages);
      messages.push(resp);
      return resp.text;
    },
  };
};
