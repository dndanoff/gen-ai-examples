import { cases, CaseId } from '@src/cases';
import { EXIT_CMD, ExitCmd } from '@src/constants';
import { ask, cli, print } from '@src/userCli';

const chooseScenario = async (): Promise<CaseId | ExitCmd> => {
  print('Choose a genAI case to demonstrate:');
  for (const [key, value] of Object.entries(cases)) {
    print(`  ${key}) ${value.name} - ${value.description}`);
  }
  print(`  ${EXIT_CMD}) Exit`);
  const answer = await ask('\nSelect an option: ');

  if (answer === EXIT_CMD) {
    return EXIT_CMD;
  } else if (Object.keys(cases).includes(answer)) {
    return answer as CaseId;
  }

  print(
    `[warn] Invalid choice ${answer}. Please choose an option or type "exit".`,
  );
  return await chooseScenario();
};

const main = async () => {
  print('=== Gen-AI CLI ===');
  while (true) {
    const choice = await chooseScenario();
    if (choice === EXIT_CMD) {
      break;
    }
    const selectedCase = cases[choice];
    if (!selectedCase) {
      print(`Case "${choice}" not found, please try again.`);
      continue;
    }
    try {
      const result = await selectedCase.start();
      // Optional: act on result.reason (see section 3)
      if (result?.reason) {
        print(`[info] Case finished: ${result.reason}`);
      }
    } catch (err) {
      print('[case error] Unhandled error in case:', err);
    }
  }
  print('Goodbye!');
  await cli.close();
};

main().catch(async (err) => {
  print('[fatal] Unexpected error:', err);
  process.exit(1);
});
