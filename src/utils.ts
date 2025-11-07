const isLoggingEnabled = true;

export const log = (message: string, ...args: any[]) => {
  if (isLoggingEnabled) {
    console.log(`[log ${new Date().toISOString()}] ${message}`, ...args);
  }
};

export const withLogging =
  (fn: Function, name?: string) =>
  async (...args: any[]) => {
    log(`Calling ${name ?? fn.name} with:`, ...args);
    const result = await fn(...args);
    log(`${name ?? fn.name} result:`, result);
    return result;
  };

export const withErrorHandling =
  (fn: Function, name?: string) =>
  async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (err) {
      log(`Error in ${name ?? fn.name}:`, err);
      throw err;
    }
  };
