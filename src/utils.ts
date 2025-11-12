const requestTracker = new Map<
  string,
  { count: number; lastRequest: number }
>();

export const rateLimitCheck = (identifier: string): boolean => {
  const now = Date.now();
  const userStats = requestTracker.get(identifier) || {
    count: 0,
    lastRequest: 0,
  };

  // Reset counter every hour
  if (now - userStats.lastRequest > 3600000) {
    userStats.count = 0;
  }

  userStats.count++;
  userStats.lastRequest = now;
  requestTracker.set(identifier, userStats);

  // Max 10 requests per hour
  return userStats.count <= 10;
};

const isLoggingEnabled = true;

export const log = (message: string, ...args: any[]) => {
  if (isLoggingEnabled) {
    console.log(`[log ${new Date().toISOString()}] ${message}`, ...args);
  }
};

export const withLogging =
  (fn: Function, name?: string) =>
  async (...args: any[]) => {
    try {
      log(`Calling ${name ?? fn.name} with:`, ...args);
      const result = await fn(...args);
      log(`${name ?? fn.name} result:`, result);
      return result;
    } catch (error) {
      log(`Error in ${name ?? fn.name}:`, error);
      throw error;
    }
  };
