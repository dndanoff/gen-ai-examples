# Gen-AI CLI (Node.js + TypeScript)

A minimal CLI starter using TypeScript, with LangChain + LangGraph for chat completions.

## Requirements

- Node.js >= 18
- An OpenAI API key

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and set OPENAI_API_KEY
```

## Run (dev)

```bash
npm run dev
```

## Build and Run (prod)

```bash
npm run build
npm start
```

## Usage

- Start the CLI, then type your prompt and press Enter.
- Type `exit` to quit.

## Where things live

- `src/index.ts` – CLI entry point using Node's `readline`.
- `src/ai/chat.ts` – Minimal LangChain + LangGraph example for chat completion.

## Notes

- Set `OPENAI_API_KEY` in your environment or `.env`.
- Optionally set `OPENAI_MODEL` (defaults to `gpt-4o-mini`).
