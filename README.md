# SupportMemory AI

**AI customer-support agent with long-term customer memory powered by [Hindsight](https://hindsight.vectorize.io).**

> Customers never have to repeat themselves. The agent remembers past issues, solutions that worked (and failed), environment, and preferences.

## Problem

Most support chatbots treat every conversation as brand new. Customers re-explain product, environment, what they tried, and what worked last time. Agents waste time searching old tickets.

## Solution

SupportMemory AI uses **Hindsight** as a persistent, queryable memory layer per customer:

1. Identify customer  
2. **Recall** relevant memories from Hindsight  
3. Build personalized AI context  
4. Respond with prior successful fixes when relevant  
5. **Extract** durable facts and **retain** them in Hindsight  

## Demo story (Sarah Johnson · CUS-1024)

| Turn | Customer | Agent behavior |
|------|----------|----------------|
| 1 | "I can't log into CloudDesk." | Diagnoses; stores issue + Windows 11/Chrome + cookie fix |
| 2 | "Login isn't working again." | **Remembers** prior issue & successful fix |
| 3 | "It started after today's update." | Links to recurring pattern; updates memory |
| 4 | "Login isn't working again." | Proactively suggests previous successful fix |

Toggle **Memory OFF** vs **Memory ON** to show the before/after difference.

## Tech stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Lucide icons  
- **Backend:** Next.js Route Handlers  
- **Memory:** [Hindsight](https://hindsight.vectorize.io) (`@vectorize-io/hindsight-client`) with local seed fallback  
- **LLM:** OpenAI-compatible API (optional; rule-based fallback works without a key)  

## Architecture

```
Customer message
  → POST /api/chat
  → Identify customer
  → Hindsight recall (or local seed)
  → Build AI context
  → LLM / fallback response
  → Extract durable facts
  → Hindsight retain + local store
  → Update Memory panel
```

## Environment variables

Copy `.env.example` → `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | Enables LLM responses (else smart rule-based demo) |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |
| `OPENAI_BASE_URL` | No | For xAI or other OpenAI-compatible endpoints |
| `HINDSIGHT_BASE_URL` | No | e.g. `https://api.hindsight.vectorize.io` or `http://localhost:8888` |
| `HINDSIGHT_API_KEY` | No | Hindsight Cloud API key |

Without Hindsight credentials the app uses **seeded local memory** so the full demo works on Netlify immediately.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Netlify

1. Push this repo to GitHub  
2. New Netlify site → import repo  
3. Build command: `npm run build`  
4. Add env vars in Netlify UI (optional)  
5. Install `@netlify/plugin-nextjs` is declared in `netlify.toml`

Or:

```bash
npm i -g netlify-cli
netlify deploy --prod
```

## 2-minute judge demo

1. Open **Sarah Johnson** — show Customer Memory panel (Windows 11, Chrome, past login fix).  
2. Click **Run Memory Demo** (or send messages manually).  
3. Watch activity: *Searching customer memory…* → *3 relevant memories found* → personalized reply.  
4. Toggle **Memory OFF** and send the same message → generic questions.  
5. Toggle **Memory ON** again → "I remember… clearing session fixed it last time."  
6. Show Memory Timeline + "What worked last time?" card.

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/chat` | Memory-aware support reply |
| `GET` | `/api/customers` | List / search customers |
| `GET` | `/api/customers/:id` | Profile + memories + tickets |
| `GET/POST` | `/api/memory` | List or store / recall |
| `GET/POST` | `/api/tickets` | Ticket history |
| `POST` | `/api/seed` | Seed Hindsight banks from local data |

## Why Hindsight?

The differentiator is **persistent, queryable long-term customer memory** — not conversation history alone. Hindsight’s retain / recall / reflect operations let the agent learn which solutions actually worked and reuse them on the next contact.

## Project structure

```
src/
  app/           # pages + API routes
  components/    # SupportDashboard UI
  data/seed.ts   # Demo customers, tickets, memories
  lib/
    hindsight.ts # Hindsight client + local fallback
    ai.ts        # System prompt + LLM / fallback
  types/
```

## License

MIT — built for hackathon demo use.
