import { EXIT_CMD } from '@src/constants';
import { ask, print } from '@src/userCli';
import { CaseResult } from '@src/cases/index';
import { startChat } from '@src/core/agents/simpleChat';

export const start = async (): Promise<CaseResult> => {
  print('=== Simple Chat ===');
  print('Type your asks. Type "exit" to return to the main menu.');
  const chat = startChat();
  let count = 0;
  while (true) {
    const line = await ask('chat>');
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
