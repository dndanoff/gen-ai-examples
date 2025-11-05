import { EXIT_CMD } from '@src/constants';
import { ask, print } from '@src/userCli';
import { CaseResult } from '@src/cases/index';
import { startChat } from '@src/core/agents/agentChat';

export const start = async (): Promise<CaseResult> => {
  print('=== Agentic Chat with Web Search ===');
  print(
    'Type your asks(it can be for recent events). Type "exit" to return to the main menu.',
  );
  const chat = startChat();
  let count = 0;
  while (true) {
    const line = await ask('agent-chat>');
    if (line === EXIT_CMD) {
      return { reason: 'user_stopped', meta: { messagesExchanged: count } };
    }
    const resp = await chat.say(line);
    print(`AI: ${resp}`);
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
