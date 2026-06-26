import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  integer,
  serial,
} from 'drizzle-orm/pg-core';

export const scrapeStatusEnum = pgEnum('scrape_status', [
  'pending',
  'scraping',
  'scraped',
  'failed',
]);

export const generateStatusEnum = pgEnum('generate_status', [
  'pending',
  'generating',
  'generated',
  'failed',
]);

export const pushStatusEnum = pgEnum('push_status', [
  'pending',
  'pushed',
  'failed',
]);

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull(),
  apifyApiKey: text('apify_api_key'),
  instantlyApiKey: text('instantly_api_key'),
  instantlyCampaignId: text('instantly_campaign_id'),
  senderName: text('sender_name'),
  senderTitle: text('sender_title'),
  companyName: text('company_name'),
  valueProposition: text('value_proposition'),
  // Gmail OAuth
  gmailEmail: text('gmail_email'),
  gmailAccessToken: text('gmail_access_token'),
  gmailRefreshToken: text('gmail_refresh_token'),
  gmailTokenExpiry: timestamp('gmail_token_expiry'),
  // Stripe billing
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  plan: text('plan').default('free').notNull(), // 'free' | 'starter' | 'growth' | 'agency'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const prospects = pgTable('prospects', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  company: text('company').notNull(),
  websiteUrl: text('website_url'),
  scrapedText: text('scraped_text'),
  apifyJobId: text('apify_job_id'),
  scrapeStatus: scrapeStatusEnum('scrape_status').default('pending').notNull(),
  prospectBrief: text('prospect_brief'),
  generateStatus: generateStatusEnum('generate_status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const emailSequences = pgTable('email_sequences', {
  id: serial('id').primaryKey(),
  prospectId: integer('prospect_id').notNull().references(() => prospects.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(), // 1, 2, or 3
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  delayDays: integer('delay_days').notNull().default(0),
  pushStatus: pushStatusEnum('push_status').default('pending').notNull(),
  gmailThreadId: text('gmail_thread_id'), // set after Email 1 is sent
  gmailMessageId: text('gmail_message_id'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const scheduledEmails = pgTable('scheduled_emails', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  prospectId: integer('prospect_id').notNull().references(() => prospects.id, { onDelete: 'cascade' }),
  sequenceStepId: integer('sequence_step_id').notNull().references(() => emailSequences.id, { onDelete: 'cascade' }),
  sendAt: timestamp('send_at').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'sent' | 'failed' | 'skipped'
  gmailThreadId: text('gmail_thread_id'), // reply into this thread
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  instantlyCampaignId: text('instantly_campaign_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
