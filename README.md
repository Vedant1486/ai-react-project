# OpenAI Chat Demo

A minimal React app that calls the OpenAI Chat Completions API and displays the conversation.

## Stack
- React 18 (functional components + hooks)
- Vite
- OpenAI `/v1/chat/completions` (gpt-4o-mini)

## Setup

```bash
npm install
```

Copy `.env.local` and add your key:
```
VITE_OPENAI_API_KEY=sk-...
```

## Run

```bash
npm run dev
```

## How it works

`ChatBox.jsx` maintains a `messages` array (the full conversation history) in state.
On submit it POSTs the full history to OpenAI, appends the assistant reply, and re-renders.
The API key is injected at build time via Vite's `import.meta.env` — it never hits a backend.
