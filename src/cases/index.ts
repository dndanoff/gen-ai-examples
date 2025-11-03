import { start as startSimpleChat } from '@src/cases/simpleChat';

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
} as const;

export type CaseId = keyof typeof cases;
