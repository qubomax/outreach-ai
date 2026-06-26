# Cold Hero — Claude Project Context

## Who I Am

Solo founder building a profitable, AI-driven SaaS from scratch. I ship lean MVPs
fast, monetize early, and expand based on revenue signals. I make decisions quickly —
once a decision is logged in .claude/DECISIONS.md, don't re-debate it.

---

## What This Project Is

**AI Cold Outreach Engine — Research, Write, and Send**

B2B sales teams and founders waste hours manually personalizing cold emails.
Cold Hero automates the full pipeline from research to delivery:

1. User connects their Gmail or Outlook inbox (OAuth, one-time setup)
2. User uploads a CSV of prospects (name, email, company, website URL)
3. App scrapes each company website via Apify (Cold Hero's account — users never touch Apify)
4. Claude summarizes the scrape into a 150-word prospect brief
5. Claude generates a personalized 3-step email sequence per prospect
6. User reviews and edits sequences in the UI
7. User clicks Send — Cold Hero sends Email 1 via Gmail/Outlook API immediately
8. Emails 2 and 3 send automatically on schedule if no reply detected
9. Dashboard shows sent/replied counts from DB

**Instantly.ai has been removed.** Cold Hero owns the full loop — research, writing, and sending.

---

## Tech Stack

| Role | Tool |
|------|------|
| Framework | Next.js 14 (App Router) |
| Auth | Clerk |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle |
| Web scraping | Apify — `apify/website-content-crawler` (Cold Hero's account) |
| AI | Anthropic SDK — `claude-sonnet-4-6` |
| Email sending | Gmail API / Microsoft Graph API (user's connected inbox) |
| Email scheduling | Vercel Cron + DB scheduled_emails table |
| UI components | Tailwind + shadcn/ui |
| Payments | Stripe |
| Hosting | Vercel |

---

## Architecture Principles

- Solo developer — no microservices, no unnecessary abstraction
- Server actions or simple REST endpoints — no over-engineering
- MVP must work reliably for 1–50 users, not 10,000
- Cold Hero handles everything: scraping, AI, sending, scheduling
- Users only need to connect their inbox — no third-party tools required

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
│   │   ├── page.tsx                 # Landing page
│   │   ├── dashboard/page.tsx       # Dashboard — stats + recent prospects
│   │   ├── prospects/page.tsx       # CSV upload + prospect table
│   │   ├── sequences/page.tsx       # Sequence list
│   │   ├── sequences/[id]/page.tsx  # Sequence editor (brief + email steps)
│   │   ├── settings/page.tsx        # Sender profile + connected inbox
│   │   ├── account/page.tsx         # Billing / plan management
│   │   └── api/
│   │       ├── prospects/           # CRUD + CSV upload
│   │       ├── scrape/              # Trigger Apify, poll for completion
│   │       ├── generate/            # Generate brief + sequence via Claude
│   │       ├── send/                # Send Email 1 via Gmail/Outlook API
│   │       ├── cron/send-scheduled/ # Vercel Cron: send Email 2 & 3 on schedule
│   │       ├── gmail/               # Gmail OAuth callback + token storage
│   │       ├── sequences/           # CRUD for email steps
│   │       └── stripe/              # Checkout, webhook, portal
│   ├── components/
│   │   ├── sidebar.tsx              # App navigation
│   │   └── ui/                      # shadcn/ui base components
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts             # Neon connection + Drizzle client
│   │   │   └── schema.ts            # All table definitions
│   │   ├── agents/
│   │   │   ├── research-agent.ts    # Apify scrape → prospect brief
│   │   │   └── sequence-agent.ts    # Brief → email sequence
│   │   ├── apify.ts                 # Apify scraping client
│   │   ├── claude.ts                # Anthropic SDK client
│   │   ├── gmail.ts                 # Gmail API client (send, check replies)
│   │   ├── user-settings.ts         # Fetch user settings from DB
│   │   └── utils.ts                 # Shared utilities
│   └── types/
│       └── index.ts                 # TypeScript types
├── scripts/
│   ├── seed.ts                      # Insert test prospects without the UI
│   ├── clear-prospects.ts           # Clear prospect/sequence data (never deletes users)
│   └── test-apify.ts                # Run a scrape manually to verify output
└── .env.local                       # API keys (gitignored)
```

---

## Core Files to Know

- `src/lib/db/schema.ts` — all Drizzle table definitions (check before any DB changes)
- `src/lib/claude.ts` — Anthropic SDK client
- `src/lib/apify.ts` — Apify scraping client
- `src/lib/gmail.ts` — Gmail API client (to be built)
- `src/lib/agents/research-agent.ts` — orchestrates scrape → brief
- `src/lib/agents/sequence-agent.ts` — orchestrates brief → sequence
- `prompts/prospect-brief.md` — prompt: scraped text → brief
- `prompts/email-sequence.md` — prompt: brief → 3-step sequence (JSON)
- `.claude/DECISIONS.md` — settled decisions, do not re-debate

---

## Database Tables

- `users` — Clerk user sync, sender profile, Gmail OAuth tokens, Stripe billing
- `prospects` — one row per prospect, tracks scrape and generation status
- `email_sequences` — one row per email step (3 steps per prospect)
- `scheduled_emails` — queue of emails to send on a future date (Email 2 & 3)

---

## AI Pipeline

**Stage 1 — Brief generation**
- Input: raw scraped text (capped at 10,000 chars)
- Output: 150-word prospect brief
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

## Email Sending Pattern

```
User clicks Send
  → POST /api/send { prospectId }
  → Send Email 1 via Gmail API immediately
  → Insert Email 2 and Email 3 into scheduled_emails table with send_at dates
  → Vercel Cron runs /api/cron/send-scheduled every hour
  → Cron checks scheduled_emails for due rows
  → For each due email: check if prospect replied → if not, send via Gmail API
  → Mark scheduled_email as sent
```

---

## Environment Variables

```
ANTHROPIC_API_KEY=
APIFY_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
DATABASE_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_GROWTH=
STRIPE_PRICE_AGENCY=
CRON_SECRET=
```

---

## Build Order

### Phase 1 — DONE (Instantly-based MVP)
- [x] CSV upload → scrape → generate pipeline
- [x] Sequence editor (two-panel: brief + emails)
- [x] Clerk auth
- [x] Stripe billing (3 tiers: $49 / $149 / $399)
- [x] Dashboard stats (prospects, sequences, pushed count)

### Phase 2 — Gmail sending (current focus)
- [ ] Remove Instantly integration (push button, instantly.ts, API key from settings)
- [ ] Add `scheduled_emails` table to schema + migrate
- [ ] Add `gmailAccessToken` / `gmailRefreshToken` columns to `users` table
- [ ] Gmail OAuth flow: connect inbox in Settings
- [ ] `src/lib/gmail.ts` — send email, check for replies
- [ ] POST /api/send — send Email 1 + schedule Email 2 & 3
- [ ] GET /api/cron/send-scheduled — Vercel Cron job (hourly)
- [ ] Reply detection before sending Email 2 & 3
- [ ] Update sequence editor: "Send" button replaces "Push to Instantly"
- [ ] Dashboard: show sent/replied counts from DB

### Phase 3 — Polish
- [ ] Outlook / Microsoft Graph support
- [ ] Bulk send all approved sequences
- [ ] Unsubscribe link handling
- [ ] Per-prospect status: Sent / Replied / Completed / Failed
- [ ] Regenerate sequence button in editor

---

## Pricing

| Plan | Price | Prospects/mo |
|------|-------|--------------|
| Starter | $49/mo | 200 |
| Growth | $149/mo | 1,000 |
| Agency | $399/mo | 5,000 |

---

## What Is NOT in the MVP

- Outlook support (Gmail first)
- LinkedIn scraping (website only)
- Multi-user teams or workspaces
- Mobile UI
- Analytics beyond sent/replied counts

---

## Rules for Claude

- Read this file at the start of every session
- Check `docs/OVERVIEW.md` for the full product spec
- Check `src/lib/db/schema.ts` before any database changes
- Check `prompts/` before editing any AI prompts
- Log every major architectural decision in `.claude/DECISIONS.md`
- Keep it simple — no microservices, no over-engineering
- Ask before making changes outside the current phase's scope
