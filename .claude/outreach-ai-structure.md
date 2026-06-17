# outreach-ai — Project Structure

AI-powered cold outreach personalization engine.
Upload a CSV of prospects → scrape their websites → generate personalized 3-step email sequences → push to Instantly.ai.

---

## Folder Structure

```
outreach-ai/
│
├── .claude/
│   ├── CLAUDE.md               # Master context — Claude reads this automatically every session
│   └── DECISIONS.md            # Log of key decisions — prevents re-debating settled choices
│
├── docs/
│   ├── OVERVIEW.md             # Problem, target customer, core user flow, monetization
│   ├── STACK.md                # Every tool used, its role, and relevant API docs links
│   ├── ARCHITECTURE.md         # File structure, API routes, ASCII data flow diagram
│   ├── SCHEMA.md               # Drizzle/Neon table definitions and field notes
│   ├── AGENTS.md               # Claude prompt design, model choice, token budgets
│   ├── INTEGRATIONS.md         # Apify actor setup, Instantly.ai campaign config, Clerk setup
│   └── ROADMAP.md              # 3-week build plan, what is in MVP vs. later
│
├── prompts/
│   ├── prospect-brief.md       # Prompt: scraped website text → prospect brief
│   └── email-sequence.md       # Prompt: prospect brief → 3-step personalized email sequence
│
├── scripts/
│   ├── seed.ts                 # Insert test prospects into DB without the UI
│   └── test-apify.ts           # Run a scrape manually to verify Apify output
│
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Clerk sign-in and sign-up pages
│   ├── (dashboard)/
│   │   ├── page.tsx            # Dashboard home
│   │   ├── prospects/          # CSV upload, prospect list, single prospect + sequence editor
│   │   ├── campaigns/          # Campaign list and Instantly.ai stats
│   │   └── settings/           # User API keys (Apify, Instantly)
│   └── api/
│       ├── prospects/          # CRUD + CSV upload endpoint
│       ├── scrape/             # Trigger Apify per prospect
│       ├── generate/           # Generate email sequence via Claude
│       ├── campaigns/          # Campaign management + stats fetch
│       └── instantly/push/     # Push approved prospect to Instantly.ai
│
├── components/
│   ├── csv-uploader.tsx
│   ├── prospect-table.tsx
│   ├── sequence-editor.tsx
│   └── stats-card.tsx
│
├── lib/
│   ├── db/
│   │   ├── index.ts            # Neon connection + Drizzle client
│   │   └── schema.ts           # All table definitions
│   ├── apify.ts                # Apify scraping client
│   ├── claude.ts               # Anthropic SDK client + generation functions
│   ├── instantly.ts            # Instantly.ai API client
│   └── csv.ts                  # CSV parsing utility
│
├── public/
│
├── .env.example                # All required env var names, no values
├── .env.local                  # Your actual keys — never commit this
├── .gitignore
├── drizzle.config.ts
├── middleware.ts               # Clerk auth middleware
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Files to Create First (before any code)

1. `.claude/CLAUDE.md` — project brief for Claude
2. `.claude/DECISIONS.md` — start empty, fill as decisions are made
3. `docs/OVERVIEW.md` — what this product is
4. `docs/STACK.md` — technology choices
5. `docs/SCHEMA.md` — database tables
6. `prompts/prospect-brief.md` — first Claude prompt
7. `prompts/email-sequence.md` — second Claude prompt
8. `.env.example` — list all required keys upfront

---

## Core User Flow

```
User uploads CSV (name, email, company, website URL)
        ↓
App stores prospects in Neon (Postgres)
        ↓
Apify scrapes each company website (website-content-crawler actor)
        ↓
Claude (claude-sonnet-4-6) summarizes scrape → prospect brief
        ↓
Claude generates 3-step personalized email sequence from brief
        ↓
User reviews and edits sequences in the UI
        ↓
User pushes approved sequences to Instantly.ai (one-click or bulk)
        ↓
Dashboard shows open rate / reply rate pulled from Instantly.ai
```

---

## Key Technology Choices

| Role | Tool |
|------|------|
| Framework | Next.js 14 (App Router) |
| Auth | Clerk |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle |
| Web scraping | Apify — `apify/website-content-crawler` actor |
| AI generation | Anthropic SDK — `claude-sonnet-4-6` |
| Email delivery | Instantly.ai |
| UI components | 21st.dev |
| Hosting | Vercel |

---

## Environment Variables Needed

```
# Anthropic
ANTHROPIC_API_KEY=

# Apify
APIFY_API_KEY=

# Instantly.ai
INSTANTLY_API_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Neon
DATABASE_URL=
```
