# outreach-ai — Claude Project Context

## Who I Am

Solo founder building a profitable, AI-driven SaaS from scratch. I ship lean MVPs
fast, monetize early, and expand based on revenue signals. I make decisions quickly —
once a decision is logged in .claude/DECISIONS.md, don't re-debate it.

---

## What This Project Is

**AI Cold Outreach Personalization Engine**

B2B sales teams and founders waste hours manually personalizing cold emails.
This product automates the full research-to-sequence pipeline:

1. User uploads a CSV of prospects (name, email, company, website URL)
2. App scrapes each company website via Apify
3. Claude summarizes the scrape into a 150-word prospect brief
4. Claude generates a personalized 3-step email sequence per prospect
5. User reviews and edits sequences in the UI
6. User pushes approved sequences to Instantly.ai in one click
7. Dashboard shows campaign performance (open rate, reply rate) from Instantly.ai

---

## Tech Stack

| Role | Tool |
|------|------|
| Framework | Next.js 14 (App Router) |
| Auth | Clerk |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle |
| Web scraping | Apify — `apify/website-content-crawler` actor |
| AI | Anthropic SDK — `claude-sonnet-4-6` |
| Email delivery | Instantly.ai |
| UI components | 21st.dev + Tailwind + shadcn/ui |
| Hosting | Vercel |

---

## Architecture Principles

- Solo developer — no microservices, no unnecessary abstraction
- Server actions or simple REST endpoints — no over-engineering
- MVP must work reliably for 1–50 users, not 10,000
- Core loop first: CSV upload → scrape → generate → push to Instantly.ai
- Auth and billing are Week 2 concerns

---

## Project Structure

```
outreach-ai/
├── CLAUDE.md                        # This file — read at start of every session
├── .claude/
│   └── DECISIONS.md                 # Settled decisions — do not re-debate
├── docs/
│   └── OVERVIEW.md                  # Full product spec and flow diagram
├── prompts/
│   ├── prospect-brief.md            # Scraped text → 150-word prospect brief
│   └── email-sequence.md            # Brief → 3-step email sequence (JSON)
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Dashboard
│   │   ├── prospects/page.tsx       # CSV upload + prospect table
│   │   ├── sequences/page.tsx       # Sequence list
│   │   ├── sequences/[id]/page.tsx  # Sequence editor (brief + email steps)
│   │   ├── campaigns/page.tsx       # Instantly.ai stats
│   │   ├── settings/page.tsx        # API keys + sender profile
│   │   └── api/
│   │       ├── prospects/           # CRUD + CSV upload
│   │       ├── scrape/              # Trigger Apify, poll for completion
│   │       ├── generate/            # Generate brief + sequence via Claude
│   │       └── instantly/push/      # Push approved sequence to Instantly.ai
│   ├── components/
│   │   ├── sidebar.tsx              # App navigation
│   │   └── ui/                      # shadcn/ui base components
│   ├── lib/
│   │   ├── dummy-data.ts            # Dummy prospects + sequences for UI dev
│   │   ├── db/
│   │   │   ├── index.ts             # Neon connection + Drizzle client
│   │   │   └── schema.ts            # All table definitions
│   │   ├── agents/
│   │   │   ├── research-agent.ts    # Apify scrape → prospect brief
│   │   │   └── sequence-agent.ts    # Brief → email sequence
│   │   ├── apify.ts                 # Apify scraping client
│   │   ├── claude.ts                # Anthropic SDK client
│   │   ├── instantly.ts             # Instantly.ai API client
│   │   └── utils.ts                 # Shared utilities
│   └── types/
│       └── index.ts                 # TypeScript types
├── scripts/
│   ├── seed.ts                      # Insert test prospects without the UI
│   └── test-apify.ts                # Run a scrape manually to verify output
└── .env.local                       # API keys (gitignored)
```

---

## Core Files to Know

- `src/lib/dummy-data.ts` — dummy prospects and sequences used while building UI
- `src/lib/db/schema.ts` — all Drizzle table definitions (check before any DB changes)
- `src/lib/claude.ts` — Anthropic SDK client and both prompt functions
- `src/lib/apify.ts` — Apify scraping client
- `src/lib/instantly.ts` — Instantly.ai API client
- `src/lib/agents/research-agent.ts` — orchestrates scrape → brief
- `src/lib/agents/sequence-agent.ts` — orchestrates brief → sequence
- `prompts/prospect-brief.md` — prompt: scraped text → brief
- `prompts/email-sequence.md` — prompt: brief → 3-step sequence (JSON)
- `.claude/DECISIONS.md` — settled decisions, do not re-debate

---

## Database Tables

- `users` — Clerk user sync, stores Apify + Instantly API keys per user
- `prospects` — one row per prospect, tracks scrape and generation status
- `email_sequences` — one row per email step (3 steps per prospect)
- `campaigns` — groups of prospects, links to Instantly.ai campaign ID

---

## AI Pipeline

**Stage 1 — Brief generation**
- Input: raw scraped text (capped at 10,000 chars)
- Output: 150-word prospect brief (what they do, their customers, a pain point, one specific detail)
- Model: `claude-sonnet-4-6`
- Prompt: `prompts/prospect-brief.md`

**Stage 2 — Sequence generation**
- Input: prospect brief + sender info + value proposition
- Output: 3-step email sequence `{ subject, body, delay_days }` as JSON
- Model: `claude-sonnet-4-6`
- Prompt: `prompts/email-sequence.md`

---

## Async Scraping Pattern

Apify jobs are async — never scrape synchronously in an API route (Vercel timeout).

```
POST /api/scrape      → trigger Apify job → store job ID → return immediately
GET  /api/scrape/[id] → poll Apify for status → when done, store result → trigger generation
```

---

## Environment Variables

```
ANTHROPIC_API_KEY=
APIFY_API_KEY=
INSTANTLY_API_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
DATABASE_URL=
```

---

## Build Order

### Week 1 — Core loop (UI built with dummy data ✓)
- [x] Next.js scaffold + folder structure
- [x] Dummy data UI: dashboard, prospects, sequence editor, campaigns, settings
- [x] docs/OVERVIEW.md — full product spec
- [ ] Neon + Drizzle schema and migrations
- [ ] CSV upload → parse → store prospects in DB
- [ ] Apify scraping pipeline (async)
- [ ] Claude prospect brief generation
- [ ] Claude email sequence generation

### Week 2 — Auth and integrations
- [ ] Clerk auth + middleware
- [ ] Instantly.ai push integration
- [ ] Sequence editor two-panel layout (brief left, emails right)
- [ ] Settings page saves API keys to DB

### Week 3 — Polish and monetization
- [ ] Dashboard: live open/reply rate stats from Instantly.ai
- [ ] Stripe billing (3 tiers: $49 / $149 / $399)
- [ ] Error handling, retry logic, loading states
- [ ] Deploy to Vercel

---

## Pricing

| Plan | Price | Prospects/mo |
|------|-------|--------------|
| Starter | $49/mo | 200 |
| Growth | $149/mo | 1,000 |
| Agency | $399/mo | 5,000 |

---

## What Is NOT in the MVP

- Multi-user teams or workspaces
- Built-in email sending (Instantly.ai handles delivery)
- LinkedIn scraping (website only for now)
- Stripe billing (Week 3)
- Analytics beyond what Instantly.ai returns
- Mobile UI

---

## Rules for Claude

- Read this file at the start of every session
- Check `docs/OVERVIEW.md` for the full product spec
- Check `src/lib/db/schema.ts` before any database changes
- Check `prompts/` before editing any AI prompts
- Log every major architectural decision in `.claude/DECISIONS.md`
- Build Week 1 core loop before any auth, billing, or polish
- Keep it simple — no microservices, no over-engineering
- Ask before making changes outside the current week's scope
