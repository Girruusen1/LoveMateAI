# LoveMate

An AI relationship companion: decode messages, write confessions and replies, plan dates and trips, practise hard conversations, and keep a shared space with your partner. Built with React 19, TypeScript, Vite and Tailwind, with generative AI powered by free Groq and OpenRouter models (with automatic failover) or Claude.

## Quick start

```bash
npm install
cp .env.example .env.local     # then add free GROQ_API_KEY and OPENROUTER_API_KEY
npm run dev                    # http://localhost:5173
```

Without a key the app still runs in **demo mode**: a banner says so, and AI features use an offline simulator.

## Production

```bash
npm run build
npm start                      # serves dist/ and the AI API on http://localhost:8787 (PORT to change)
```

`npm start` needs Node 22.6 or newer and reads `.env` / `.env.local`.

## Configuration

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | **Free** main provider (GPT-OSS 120B and Qwen models, no card). Get one at console.groq.com/keys. |
| `OPENROUTER_API_KEY` | **Free** backup provider, used when Groq is down or over its limit. Get one at openrouter.ai/settings/keys. Free models allow about 20 requests a minute and 50 a day. |
| `ANTHROPIC_API_KEY` | Optional paid Claude key, best quality. Tried first when set. |
| `LOVEMATE_AI_PROVIDERS` | Failover order, e.g. `openrouter,groq`. Default `anthropic,groq,openrouter`; providers without a key are skipped. |
| `LOVEMATE_AI_TIMEOUT_MS` | Milliseconds to wait for a provider before switching. Default 45000 (free models can be slow). |
| `GROQ_MODEL`, `GROQ_VISION_MODEL` | Groq models. Defaults `openai/gpt-oss-120b` (text) and `qwen/qwen3.8-27b` (screenshots). |
| `OPENROUTER_MODEL`, `OPENROUTER_VISION_MODEL` | OpenRouter models. Defaults `nvidia/nemotron-3-ultra-550b-a55b:free` (text) and `google/gemma-4-31b-it:free` (screenshots). When a free model is busy, OpenRouter tries the Gemma 4 models next. |
| `LOVEMATE_PUBLIC_URL` | Your site address, sent to OpenRouter to identify the app. |
| `LOVEMATE_MODEL` | Model to use. Default `claude-opus-5-5`. `claude-sonnet-5-5` or `claude-haiku-5-5` cost less. |
| `LOVEMATE_RATE_LIMIT` | AI requests allowed per IP per minute. Default 30. |

## How the generative AI works

```
browser ──► /api/ai/*  (server/genai, runs inside Vite in dev, server/index.ts in prod) ──► Groq ─(fails)─► OpenRouter   (Claude first if a key is set)
```

- **Server-side gateway.** The browser only names a task and sends inputs. Prompts, schemas and the API key live on the server, so prompts can't be injected from the client.
- **Several providers with failover.** Every request goes to the first healthy provider. If it is over its limit, returns an error, can't be reached, or doesn't answer within the timeout, the next one handles the request (`server/genai/failover.ts`). A provider that failed is skipped for a short cooldown (60 s after a rate limit, 30 s after an error), so users don't wait for it again. Chat switches only before the first word has been shown. Safety refusals are never retried elsewhere. `/api/ai/status` shows each provider's health.
- **Shared logic.** All providers use the same prompts, schemas and validation (`server/genai/openaiCompat.ts` for Groq and OpenRouter, `server/genai/llm.ts` for Claude).
- **Structured outputs.** Each tool (decode, replies, date plan, gift ideas, agent plan and 16 more) has a Zod schema in `server/genai/tasks.ts`. The model is constrained to that JSON and the SDK validates it before it reaches the UI.
- **Streaming chat.** `/api/ai/chat` streams tokens over server-sent events, so replies appear as they are written.
- **Memory as context.** Relevant saved memories are retrieved and passed to chat, the copilot and the agent planner.
- **Vision.** The screenshot analyzer sends the uploaded image to the model.
- **Guardrails.** One shared system prompt (`server/genai/prompts.ts`) sets tone, language, consent rules and crisis resources. Refusals return a clear message, and a server-side fallback model is enabled.
- **Cost controls.** The shared system prompt is prompt-cached, effort is set per task, there is per-IP rate limiting, and free-plan users have a monthly request limit.

The browser side is `src/services/ai.ts`, which keeps the same method signatures the screens already use and falls back to the simulator in `src/services/aiService.ts` only when no key is configured.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with the AI gateway |
| `npm run build` | Type-check and build to `dist/` |
| `npm start` | Production server |
| `npm run lint` | Lint with oxlint |
