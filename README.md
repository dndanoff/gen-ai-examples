
# Gen-AI CLI (Node.js + TypeScript)

A minimal CLI starter using TypeScript, with LangChain for chat completions. Demonstrates GenAI patterns via a simple CLI interface.

## Features

- Interactive CLI for GenAI scenarios
- Modular structure for adding more cases
- TypeScript strictness and path aliases

## Requirements

- Node.js >= 18
- OpenAI API key (or compatible API)

## Setup

```bash
npm ci
cp .env.example .env
# Edit .env and set AI_API_KEY, AI_BASE_URL, and optionally AI_MODEL
```

## Run (development)

```bash
npm run start:dev
```

## Build and Run (production)

```bash
npm run build
npm start
```

## Usage

1. Start the CLI: `npm run start:dev` or `npm start` after build.
2. Choose a GenAI case.
3. Type your message and press Enter.
4. Type `exit` to quit or return to the main menu.

## Project Structure

- `src/index.ts` – CLI entry point (menu, scenario selection)
- `src/userCli.ts` – User input/output helpers
- `src/config.ts` – Environment/config management
- `src/constants.ts` – Shared constants (e.g., exit command)
- `src/agents/llm.ts` – LangChain LLM agent setup
- `src/cases/` – Scenario modules (e.g., `simpleChat`)

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```
AI_API_KEY=sk-...
AI_BASE_URL=https://api.openai.com/v1
# Optional: override default model
AI_MODEL=gpt-4o-mini
```

## Scripts

- `npm run start:dev` – Run CLI in dev mode (TypeScript)
- `npm run build` – Build for production
- `npm start` – Run built CLI
- `npm run check` – Lint, format, and type-check

## Extending

- Add new cases in `src/cases/`
- Register them in `src/cases/index.ts`

## Notes

- Uses LangChain and OpenAI for chat completions
- Strict TypeScript config and ESLint/Prettier setup
