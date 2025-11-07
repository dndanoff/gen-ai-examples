import 'dotenv/config';
import { print } from '@src/userCli';

// Define valid environment types
const NODE_ENVS = ['dev', 'test', 'prod'] as const;
type NodeEnv = (typeof NODE_ENVS)[number];

// Define the shape of config
interface Config {
  nodeEnv: NodeEnv;
  mockData: boolean;
  ai: {
    apiKey: string;
    baseUrl: string;
    model: string;
    searchApiKey: string;
  };
}

// Type-safe environment defaults
const environmentDefaults: Record<NodeEnv, Omit<Config, 'ai'>> = {
  dev: {
    nodeEnv: 'dev',
    mockData: true,
  },
  test: {
    nodeEnv: 'test',
    mockData: true,
  },
  prod: {
    nodeEnv: 'prod',
    mockData: false,
  },
};

// Required environment variables (no defaults)
const requiredEnvVars = [
  'AI_API_KEY',
  'AI_BASE_URL',
  'AI_MODEL',
  'SEARCH_API_KEY',
] as const;

// Validation helper
const validateNodeEnv = (env: string | undefined): NodeEnv => {
  if (!env || !NODE_ENVS.includes(env as NodeEnv)) {
    print(`Invalid NODE_ENV: ${env}, defaulting to 'dev'`);
    return 'dev';
  }
  return env as NodeEnv;
};

const parseBoolean = (value: string | undefined): boolean | undefined => {
  return value?.toLowerCase() === 'true';
};

const validateRequiredEnv = (): void => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
};

// Build config
const createConfig = (): Config => {
  validateRequiredEnv();

  const nodeEnv = validateNodeEnv(process.env.NODE_ENV);
  const defaults = environmentDefaults[nodeEnv];

  return {
    ...defaults,
    mockData: parseBoolean(process.env.MOCK_DATA) ?? defaults.mockData,
    ai: {
      apiKey: process.env.AI_API_KEY!,
      baseUrl: process.env.AI_BASE_URL!,
      model: process.env.AI_MODEL!,
      searchApiKey: process.env.SEARCH_API_KEY!,
    },
  };
};

const config = createConfig();
export { config, NODE_ENVS, type NodeEnv, type Config };
