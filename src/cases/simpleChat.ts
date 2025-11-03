import { EXIT_CMD } from '@src/constants';
import { ask, print } from '@src/userCli';
import { CaseResult } from '@src/cases/index';
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { llm } from '@src/agents/llm';

const systemMessage = new SystemMessage(
  'You are a helpful AI assistant engaged in a simple chat with a user.',
);

export const start = async (): Promise<CaseResult> => {
  const messages: BaseMessage[] = [systemMessage];
  print('=== Simple Chat ===');
  print('Type your asks. Type "exit" to return to the main menu.');
  let count = 0;
  while (true) {
    const line = await ask('chat>');
    if (line === EXIT_CMD) {
      return { reason: 'user_stopped', meta: { messagesExchanged: count } };
    }
    messages.push(new HumanMessage(line));
    const resp = await llm.invoke(messages);
    print(`AI: ${resp.text}`);
    messages.push(resp);
    count += 1;

    if (count >= 10) {
      print(
        '[info] Reached maximum number of exchanges (10). Ending chat session.',
      );
      break;
    }
  }
  return { reason: 'completed', meta: { messagesExchanged: count } };
};
