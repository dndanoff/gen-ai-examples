import { start as startSimpleChat } from '@src/cases/simpleChatCase';
import { start as startAgenticChat } from '@src/cases/chatWithSearchCase';
import { start as startGenerator } from '@src/cases/generateProjectDescriptionCase';

export interface CaseResult {
  reason: 'user_stopped' | 'completed';
  meta?: Record<string, unknown>;
}

export const cases = {
  simpleChat: {
    name: 'Simple Chat',
    description: 'Engage in a simple chat with the AI assistant.',
    start: startSimpleChat,
  },
  agenticChat: {
    name: 'Agentic Chat with Web Search',
    description:
      'Engage in a chat with the AI assistant that can perform web searches for recent events.',
    start: startAgenticChat,
  },
  generator: {
    name: 'Project Description Generator',
    description: 'Generate a project description based on your input.',
    start: startGenerator,
  },
} as const;

export type CaseId = keyof typeof cases;
