export const constants = Object.freeze({
  EXIT_CMD: 'exit',
});

export type ExitCmd = (typeof constants)['EXIT_CMD'];
