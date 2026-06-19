import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from './db';
import { users } from './db/schema';

export async function getAuthUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

// Call on first user action — creates the user row if it doesn't exist yet
export async function ensureUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? '';

  await db.insert(users).values({ id: userId, email }).onConflictDoNothing();

  return userId;
}
