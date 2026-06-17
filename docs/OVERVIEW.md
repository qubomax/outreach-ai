# outreach-ai — Product Overview

## What This Is

outreach-ai is an AI-powered cold outreach personalization engine.

It takes a list of prospects and automatically researches each one, writes a
hyper-personalized 3-step email sequence per contact, and pushes everything
to Instantly.ai ready to send — in minutes instead of days.

---

## The Problem

Cold email is one of the fastest ways to get customers when you are starting
from zero. You do not need an audience, you do not need to wait for SEO, you
do not need to run ads. You identify exactly who you want as a customer and
reach out directly.

The problem is cold email only works when it feels personal and relevant.
Writing a genuinely personalized email requires researching the company,
understanding their context, and crafting a message that speaks to their
specific situation. That takes 15–30 minutes per prospect manually.

At 100 prospects that is 25–50 hours of work.

So most people skip the research and send generic emails instead:

> "Hi [First Name], I hope this email finds you well. I wanted to reach out
> about our solution that helps companies like yours achieve their goals.
> Would you be open to a quick call?"

Nobody responds to that. It is obviously a mass blast. Reply rates crater.
Pipeline dries up.

What actually works is an email that proves you looked at who they are:

> "Hi Sarah, noticed Loomstack just launched an enterprise tier last month —
> looks like you are making a push upmarket. We help sales teams at exactly
> that stage do personalized outbound at scale. Worth a quick chat?"

outreach-ai writes the second kind of email — for every single prospect on
your list — automatically.

---

## Who This Is For

- Solo founders doing their own outbound with no sales team
- SDRs and small sales teams at 5–50 person B2B companies
- Agencies running outbound campaigns for multiple clients

These people already pay for tools like Apollo, Clay, and Instantly.ai.
They have the sending infrastructure. What they are missing is the
personalization layer in between — research and writing. That is exactly
what outreach-ai provides.

---

## How It Works

### Step 1 — Upload a CSV

The user uploads a CSV of prospects. This can be exported from LinkedIn,
Apollo, a CRM, or built manually. The CSV needs four columns:

```
Name, Email, Company, Website URL
Sarah Reynolds, sarah@loomstack.io, Loomstack, loomstack.io
Marcus Klein, m.klein@bridgeops.com, BridgeOps, bridgeops.com
```

The app stores each prospect in the database with a status of "Pending."

---

### Step 2 — Automatic Website Scraping

For every prospect in the list, the app automatically visits their company
website and extracts the content. This is handled by Apify using the
`apify/website-content-crawler` actor.

The scraper looks for:

- What the company does and who their customers are
- What problems they claim to solve
- Pricing page signals (tiers, recent changes)
- Any recent announcements or product launches

This runs in the background. The user sees each prospect move from
"Pending" to "Scraping" in the dashboard. Scraping is async — the app
triggers the job, stores the Apify job ID, and polls for completion.
It never blocks the UI.

> **Note on timing:** Apify can take 2–5 minutes per prospect on cold runs.
> For large batches this means the pipeline may run for several hours — but
> it is fully automatic and the user does not need to wait or do anything.

---

### Step 3 — AI Prospect Brief Generation

Once the scrape completes, Claude reads the raw website content (capped
at 10,000 characters) and summarizes it into a 150-word prospect brief.

The brief captures:

- What the company actually does
- Who their customers are
- A likely pain point relevant to the sender's offer
- One specific detail that can be referenced in the email opener

**Example brief:**

> Loomstack is a B2B async video tool targeting remote sales teams.
> Recently launched an enterprise tier and added a sales-specific use
> case section to their pricing page. Hired 3 sales reps in the last
> 60 days. Likely focused on scaling their outbound motion as they
> push upmarket. Pain point: personalizing outreach at volume without
> a large SDR team.

The brief is stored alongside the prospect record and shown to the user
in the sequence editor so they understand why the email says what it says.

- Prompt file: `prompts/prospect-brief.md`
- Model: `claude-sonnet-4-6`

---

### Step 4 — AI Email Sequence Generation

Claude takes the prospect brief plus the sender's value proposition and
writes a complete 3-step email sequence for that specific prospect.

Each sequence contains:

**Email 1 — Send immediately**
Opens with something specific to the prospect's situation. Makes the
connection to the sender's offer. Ends with a single, low-friction CTA
(a question, not a calendar link).

**Email 2 — Send on day 3**
Shorter follow-up if no reply. References the first email. Softer tone.
Adds a small amount of new value or context.

**Email 3 — Send on day 7**
Brief final bump. Acknowledges it may not be the right time. Leaves
the door open. No pressure.

The output is structured JSON:

```json
[
  {
    "step": 1,
    "subject": "quick thought on Loomstack's sales rollout",
    "body": "Hi Sarah,\n\nNoticed Loomstack just added a dedicated sales use case...",
    "delay_days": 0
  },
  {
    "step": 2,
    "subject": "Re: quick thought on Loomstack's sales rollout",
    "body": "Hey Sarah, just bumping this up...",
    "delay_days": 3
  },
  {
    "step": 3,
    "subject": "last one from me",
    "body": "Didn't want to leave without sharing this...",
    "delay_days": 7
  }
]
```

Every prospect gets a unique sequence. Not a template with a name
swapped in — an email written around their specific context.

- Prompt file: `prompts/email-sequence.md`
- Model: `claude-sonnet-4-6`

---

### Step 5 — User Reviews and Edits

The user opens the sequence editor for any prospect. The UI shows:

- **Left panel:** the AI-generated prospect brief
- **Right panel:** the 3 email steps with fully editable subject and body fields

The user can:

- Edit any subject line or email body
- Regenerate the entire sequence with one click
- Regenerate a single step
- Approve the sequence as-is

Nothing gets sent until the user explicitly approves and pushes.

---

### Step 6 — Push to Instantly.ai

When the user is happy with a sequence, they click "Push to Instantly."

The app calls the Instantly.ai API to:

1. Create the prospect as a contact in the user's Instantly account
2. Attach the 3-step email sequence to the contact
3. Add them to the active campaign

The user can push one prospect at a time or bulk-push all approved
sequences at once.

Instantly.ai then handles everything related to actual email delivery:

- Sending at the right time
- Follow-up scheduling
- Unsubscribe handling
- Deliverability and warmup

outreach-ai does not send emails directly. Instantly.ai is the
sending infrastructure.

---

### Step 7 — Track Results

The dashboard pulls open rates and reply rates back from the
Instantly.ai API and displays them per prospect and per campaign.

Over time this tells the user:

- Which sequences are getting replies
- Which industries or company types respond best
- Which email angles and openers perform

---

## Full Flow Diagram

```
User uploads CSV (name, email, company, website URL)
              ↓
App stores prospects in Neon (status: Pending)
              ↓
Apify scrapes each company website       [background, async]
              ↓
App stores raw scraped content           [status: Scraping → Scraped]
              ↓
Claude reads scrape → generates brief    [background, async]
              ↓
Claude reads brief → generates sequence  [background, async]
              ↓                          [status: Ready]
User reviews sequences in editor UI      [user action]
              ↓
User edits and approves                  [user action]
              ↓
App pushes to Instantly.ai via API       [user action: one click]
              ↓
Instantly.ai sends emails on schedule    [Instantly handles]
              ↓
Dashboard shows open/reply rates         [pulled from Instantly API]
```

---

## What the User Actually Does

The user's active time in the product is minimal:

| Task | Time |
|------|------|
| Upload CSV | 2 minutes |
| Wait for research + writing | Runs automatically in background (2–5 min per prospect) |
| Review and edit sequences | 10–30 minutes |
| Push to Instantly | 1 click |
| Check results next day | 5 minutes |

A list of 100 prospects that would take 2 days to research and write
manually takes about 45 minutes of active user time with outreach-ai
(plus background processing time).

---

## Pricing

| Plan | Price | Prospects/mo |
|------|-------|--------------|
| Starter | $49/mo | 200 |
| Growth | $149/mo | 1,000 |
| Agency | $399/mo | 5,000 |

---

## What This Product Does NOT Do

- Send emails directly (Instantly.ai handles all delivery)
- Scrape LinkedIn profiles (website only in MVP)
- Guarantee deliverability (that is Instantly.ai's domain)
- Write emails without a website URL (needs something to research)
- Manage replies or conversations (out of scope for MVP)

---

## Tech Stack Summary

| Role | Tool |
|------|------|
| Framework | Next.js 14 (App Router) |
| Auth | Clerk |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle |
| Web scraping | Apify — `website-content-crawler` |
| AI | Anthropic SDK — `claude-sonnet-4-6` |
| Email delivery | Instantly.ai |
| UI components | 21st.dev + Tailwind |
| Hosting | Vercel |

---

## MVP Build Order

### Week 1 — Core loop (no auth, dummy data)
- [ ] Next.js project scaffold
- [ ] Neon + Drizzle schema and migrations
- [ ] CSV upload and prospect storage
- [ ] Apify scraping pipeline (async)
- [ ] Claude brief generation
- [ ] Claude sequence generation
- [ ] Basic UI to view sequences

### Week 2 — Auth and integrations
- [ ] Clerk authentication
- [ ] Instantly.ai push integration
- [ ] Sequence editor (edit before push)
- [ ] Settings page for API keys

### Week 3 — Polish and monetization
- [ ] Dashboard with open/reply rate stats
- [ ] Stripe billing (3 tiers)
- [ ] Error handling and retry logic
- [ ] Deploy to Vercel
