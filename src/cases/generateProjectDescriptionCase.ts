import { constants } from '@src/constants';
import { askMultiline, print } from '@src/userCli';
import { CaseResult } from '@src/cases/index';
import { runWorkflow } from '@src/core/workflows/cvProjectExperienceCreator';

export const start = async (): Promise<CaseResult> => {
  print('=== Project Description Generator ===');
  print(
    'Type your project description. Type "exit" to return to the main menu.',
  );

  const line = await askMultiline('generator>');
  if (line === constants.EXIT_CMD) {
    return { reason: 'user_stopped' };
  }

  const result = await runWorkflow(line);
  console.log(result);

  return { reason: 'completed', meta: { result } };
};
