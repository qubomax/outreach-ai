# External Services

All API keys go in `.env.local` (gitignored). This file tracks which account/email
each service is registered under so you can audit and migrate accounts.

---

## Anthropic (Claude AI)

| Field | Value |
|-------|-------|
| Purpose | Generates prospect briefs and 3-step email sequences |
| Dashboard | https://console.anthropic.com |
| Signed up with | sefak.kahriman@gmail.com (personal — migrate) |
| Env var | `ANTHROPIC_API_KEY` |
| Model used | `claude-sonnet-4-6` |
| Notes | Used in `/api/generate` → `src/lib/agents/` |

---

## Jina Reader (Web Scraping)

| Field | Value |
|-------|-------|
| Purpose | Scrapes company websites for prospect research |
| API | `https://r.jina.ai/{url}` |
| Cost | Free, no API key required |
| Notes | Used in `/api/scrape` → `src/lib/jina.ts`. Synchronous, parallel, 2-5s per site. Replaced Apify. |

---

## Neon (Postgres Database)

| Field | Value |
|-------|-------|
| Purpose | Stores users, prospects, email sequences, campaigns |
| Dashboard | https://console.neon.tech |
| Signed up with | sefak.kahriman@gmail.com (personal — migrate) |
| Env var | `DATABASE_URL` |
| ORM | Drizzle (`src/lib/db/`) |
| Notes | Serverless Postgres. Schema in `src/lib/db/schema.ts` |

---

## Clerk (Authentication)

| Field | Value |
|-------|-------|
| Purpose | User sign-up / sign-in / session management |
| Dashboard | https://dashboard.clerk.com |
| Signed up with | sefak.kahriman@gmail.com (personal — migrate) |
| Env vars | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| Notes | Clerk reads these automatically — no explicit `process.env` call needed in app code |

---

## Vercel (Hosting) — not yet deployed

| Field | Value |
|-------|-------|
| Purpose | Production hosting for the Next.js app |
| Dashboard | https://vercel.com |
| Signed up with | — |
| Notes | Deploy via `vercel` CLI or GitHub integration. Add all env vars from `.env.local` in the Vercel dashboard under Project → Settings → Environment Variables |

---

## Migration checklist

When you create a dedicated business account, update each service above:

- [ ] Create new email (e.g. hello@yourdomain.com or ops@yourdomain.com)
- [ ] Anthropic — new account or add new API key under org
- [x] Neon — migrated to Qubomax LLC account
- [ ] Clerk — new application (existing users will not carry over — plan a migration if you have real users)
- [ ] Vercel — new account or add project to org
- [ ] Update `.env.local` with all new keys
- [ ] Add new keys to Vercel environment variables

---

## `.env.local` template

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
DATABASE_URL=
```
