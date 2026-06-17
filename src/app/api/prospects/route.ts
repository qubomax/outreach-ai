import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { DEV_USER_ID } from '@/lib/dev-user';

export async function GET() {
  const rows = await db
    .select()
    .from(prospects)
    .where(eq(prospects.userId, DEV_USER_ID))
    .orderBy(desc(prospects.createdAt));

  return NextResponse.json(rows);
}
