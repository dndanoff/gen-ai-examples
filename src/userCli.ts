import { createInterface } from 'node:readline/promises';

type PromptOpts = {
  trim?: boolean;
  toLowerCase?: boolean;
};

const setupUserInterface = () => {
  return createInterface({ input: process.stdin, output: process.stdout });
};

export const cli = setupUserInterface();

export const ask = async (
  message: string,
  opts: PromptOpts = { trim: true, toLowerCase: false },
): Promise<string> => {
  let ans = await cli.question(message);
  if (opts.trim !== false) ans = ans.trim();
  if (opts.toLowerCase) ans = ans.toLowerCase();
  return ans;
};

export const askMultiline = async (
  message: string,
  terminator: string = 'END',
  opts: PromptOpts = { trim: true, toLowerCase: false },
): Promise<string> => {
  print(`${message} (Type '${terminator}' on a new line to finish):`);

  const lines: string[] = [];

  while (true) {
    const line = await cli.question('');

    if (line.trim() === terminator) {
      break;
    }

    lines.push(line);
  }

  let result = lines.join('\n');
  if (opts.trim !== false) result = result.trim();
  if (opts.toLowerCase) result = result.toLowerCase();

  return result;
};

export const print = (message: string, ...args: unknown[]): void => {
  // Format the message with args similar to console.log
  const formattedMessage =
    args.length > 0
      ? `${message} ${args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ')}`
      : message;
  cli.write(formattedMessage + '\n');
};
