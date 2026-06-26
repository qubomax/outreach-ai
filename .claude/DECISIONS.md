# Settled Decisions — Do Not Re-Debate

## Drop Instantly.ai, build direct Gmail/Outlook sending
**Date:** 2026-06-25
Requiring users to sign up for both Cold Hero AND Instantly.ai creates too much
friction. Users had to connect API keys, set up campaigns, and manage two paid
tools. Decision: Cold Hero owns the full loop — research, writing, AND sending.
Users connect their Gmail inbox via OAuth. Instantly.ai integration is removed.

## Apify stays but is server-side only
**Date:** 2026-06-25
Apify is kept for website scraping but is hidden infrastructure. Cold Hero uses
one Apify account (the founder's). Users never see or configure Apify. The cost
is baked into Cold Hero's pricing (~$0.50-2 per prospect scraped).

## Gmail first, Outlook later
**Date:** 2026-06-25
Start with Gmail OAuth (Google API). Outlook via Microsoft Graph is Phase 3.
Most early customers will be on Gmail or Google Workspace.

## Stripe pricing: $49 / $149 / $399 flat (no cents)
**Date:** 2026-06-25
Clean round numbers. Prospect limits: 200 / 1,000 / 5,000 per month.
Free tier has 0 prospects (no free usage).

## No free tier
**Date:** 2026-06-25
Option A was chosen: free plan gets 0 prospects. Users must subscribe to use
the product. Avoids abuse and support burden.

## Email scheduling via DB + Vercel Cron (not a queue service)
**Date:** 2026-06-25
Use a `scheduled_emails` table in Neon + Vercel Cron running hourly.
No need for Bull, SQS, or any queue infrastructure at this scale (1-50 users).
Simple, observable, easy to debug.

## Reply detection via Gmail API thread check
**Date:** 2026-06-25
Before sending Email 2 or 3, check the Gmail thread for the original email
to see if the prospect replied. If yes, skip remaining steps. This avoids
sending follow-ups after a prospect has already engaged.
