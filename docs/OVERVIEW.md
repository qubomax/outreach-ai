# Cold Hero — Product Overview

## What This Is

Cold Hero is an AI-powered cold outreach engine that handles the full pipeline:
research, writing, and sending. Users connect their Gmail or Outlook inbox,
upload a prospect list, and Cold Hero automatically researches every company,
writes a personalized 3-step email sequence per contact, and sends the emails
on schedule — all from one tool.

---

## The Problem

Cold email only works when it feels personal. Writing a genuinely personalized
email requires researching the company, understanding their context, and crafting
a message that speaks to their specific situation. That takes 15–30 minutes per
prospect manually.

At 100 prospects that is 25–50 hours of work.

So most people skip the research and send generic blasts. Nobody responds.
Reply rates crater. Pipeline dries up.

Cold Hero writes emails that prove you did your homework — for every prospect
on your list — automatically.

---

## Who This Is For

- Solo founders doing their own outbound
- SDRs and small sales teams at 5–50 person B2B companies
- Agencies running outbound campaigns for multiple clients

---

## How It Works

### Step 1 — Connect Your Inbox

The user connects their Gmail or Outlook account via OAuth. Cold Hero sends
emails from their own inbox — no new sending domain, no warmup required,
full deliverability control.

---

### Step 2 — Upload a CSV

The user uploads a CSV of prospects (exported from LinkedIn, Apollo, a CRM,
or built manually):

```
Name, Email, Company, Website URL
Sarah Reynolds, sarah@loomstack.io, Loomstack, loomstack.io
Marcus Klein, m.klein@bridgeops.com, BridgeOps, bridgeops.com
```

---

### Step 3 — Automatic Website Scraping

For every prospect, Cold Hero visits their company website and extracts content
using Apify (`website-content-crawler`). This is a Cold Hero infrastructure
cost — users never set up or pay for Apify directly.

Scraping runs in the background. The user sees each prospect move from
"Pending" → "Scraping" → "Ready" in the dashboard.

---

### Step 4 — AI Prospect Brief

Claude reads the raw website content (capped at 10,000 characters) and
generates a 150-word prospect brief capturing:

- What the company does and who their customers are
- A likely pain point relevant to the sender's offer
- One specific detail to hook the email opener

---

### Step 5 — AI Email Sequence Generation

Claude takes the brief plus the user's sender profile and value proposition
and writes a 3-step cold email sequence:

- **Email 1 (day 0):** Specific hook from the brief, creates curiosity
- **Email 2 (day 3):** Short follow-up, references value prop naturally, 2 sentences max
- **Email 3 (day 8):** Brief final bump, assumes busy not uninterested

Every prospect gets a unique sequence — not a template with a name swapped in.

---

### Step 6 — Review and Edit

The user opens the sequence editor. Left panel shows the prospect brief,
right panel shows the 3 email steps. The user can edit any subject or body,
then approve.

---

### Step 7 — Send

The user clicks "Send." Cold Hero sends Email 1 immediately from their
connected inbox, then schedules Email 2 and Email 3 automatically based
on delay days — but only if the prospect hasn't replied.

If a prospect replies at any point, the remaining steps are cancelled.

---

### Step 8 — Track Results

The dashboard shows per-prospect and per-campaign stats pulled directly
from Gmail/Outlook:

- Emails sent
- Replies received
- Sequences completed vs stopped early (replied)

---

## Full Flow Diagram

```
User connects Gmail or Outlook (OAuth, one-time)
              ↓
User uploads CSV (name, email, company, website URL)
              ↓
App stores prospects in Neon (status: Pending)
              ↓
Apify scrapes each company website       [background, async — Cold Hero's cost]
              ↓
Claude reads scrape → generates brief    [background, async]
              ↓
Claude reads brief → generates sequence  [background, async]
              ↓                          [status: Ready]
User reviews + edits sequences           [user action]
              ↓
User clicks Send                         [user action]
              ↓
Cold Hero sends Email 1 via Gmail/Outlook API
              ↓
Scheduler sends Email 2 on day 3 (if no reply)
              ↓
Scheduler sends Email 3 on day 8 (if no reply)
              ↓
Dashboard shows reply stats
```

---

## What the User Does

| Task | Time |
|------|------|
| Connect inbox (one-time) | 1 minute |
| Upload CSV | 2 minutes |
| Wait for research + writing | Automatic (2–5 min per prospect) |
| Review and edit sequences | 10–30 minutes |
| Click Send | 1 click |
| Check results | 5 minutes next day |

---

## Tech Stack

| Role | Tool |
|------|------|
| Framework | Next.js 14 (App Router) |
| Auth | Clerk |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle |
| Web scraping | Apify — `website-content-crawler` (Cold Hero's account) |
| AI | Anthropic SDK — `claude-sonnet-4-6` |
| Email sending | Gmail API / Microsoft Graph API (user's connected inbox) |
| Email scheduling | Neon + cron job (Vercel Cron or pg_cron) |
| UI components | Tailwind + shadcn/ui |
| Payments | Stripe |
| Hosting | Vercel |

---

## Pricing

| Plan | Price | Prospects/mo |
|------|-------|--------------|
| Starter | $49/mo | 200 |
| Growth | $149/mo | 1,000 |
| Agency | $399/mo | 5,000 |

---

## What Cold Hero Does NOT Do

- Require Instantly.ai or any third-party sending tool
- Expose Apify to users (it's hidden infrastructure)
- Scrape LinkedIn profiles (website only)
- Manage conversations or replies (user handles those in their own inbox)
- Guarantee deliverability (depends on sender domain health)

---

## Build Order

### Phase 1 — DONE (Instantly-based MVP)
- [x] CSV upload → scrape → generate pipeline
- [x] Sequence editor
- [x] Clerk auth
- [x] Stripe billing
- [x] Instantly.ai push (to be removed)
- [x] Dashboard stats

### Phase 2 — Gmail/Outlook sending (current)
- [ ] Remove Instantly integration and API key from Settings
- [ ] Gmail OAuth (connect sender inbox)
- [ ] Send Email 1 via Gmail API on approval
- [ ] Scheduled jobs: send Email 2 on day 3, Email 3 on day 8
- [ ] Reply detection: cancel remaining steps if prospect replied
- [ ] Dashboard: show sent/replied counts from DB

### Phase 3 — Polish
- [ ] Outlook / Microsoft Graph support
- [ ] Bulk send (send all approved sequences at once)
- [ ] Unsubscribe link handling
- [ ] Per-prospect status: Sent / Replied / Completed
- [ ] Regenerate sequence button
