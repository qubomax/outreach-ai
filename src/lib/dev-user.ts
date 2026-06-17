import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Temporary dev user until Clerk is integrated in Week 2
export const DEV_USER_ID = 'dev';

export async function ensureDevUser() {
  const existing = await db.select().from(users).where(eq(users.id, DEV_USER_ID)).limit(1);
  if (existing.length === 0) {
    await db.insert(users).values({
      id: DEV_USER_ID,
      email: 'dev@outreach-ai.local',
    });
  }
}
