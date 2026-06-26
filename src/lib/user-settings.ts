import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

export interface UserSettings {
  apifyApiKey: string;
  senderName: string;
  companyName: string;
  valueProposition: string;
  gmailEmail: string | null;
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  return {
    apifyApiKey: user?.apifyApiKey || process.env.APIFY_API_KEY || '',
    senderName: user?.senderName || '',
    companyName: user?.companyName || '',
    valueProposition:
      user?.valueProposition ||
      'We help B2B sales teams send hyper-personalized cold emails at scale — automatically researching each prospect and generating a custom 3-step sequence per contact.',
    gmailEmail: user?.gmailEmail || null,
  };
}
