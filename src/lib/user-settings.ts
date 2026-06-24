import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

export interface UserSettings {
  apifyApiKey: string;
  instantlyApiKey: string;
  instantlyCampaignId: string;
  senderName: string;
  companyName: string;
  valueProposition: string;
}

// Returns the user's settings from DB, falling back to env vars for each field.
// This means the app works out of the box with .env.local, and each user can
// override with their own keys via the Settings page.
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  return {
    apifyApiKey: user?.apifyApiKey || process.env.APIFY_API_KEY || '',
    instantlyApiKey: user?.instantlyApiKey || process.env.INSTANTLY_API_KEY || '',
    instantlyCampaignId: user?.instantlyCampaignId || process.env.INSTANTLY_CAMPAIGN_ID || '',
    senderName: user?.senderName || 'Alex',
    companyName: user?.companyName || 'outreach-ai',
    valueProposition:
      user?.valueProposition ||
      'We help B2B sales teams send hyper-personalized cold emails at scale — automatically researching each prospect and generating a custom 3-step sequence per contact.',
  };
}
