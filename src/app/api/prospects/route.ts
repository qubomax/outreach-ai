import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects, emailSequences } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    const rows = await db
      .select({
        id: prospects.id,
        userId: prospects.userId,
        firstName: prospects.firstName,
        lastName: prospects.lastName,
        email: prospects.email,
        company: prospects.company,
        websiteUrl: prospects.websiteUrl,
        scrapeStatus: prospects.scrapeStatus,
        generateStatus: prospects.generateStatus,
        createdAt: prospects.createdAt,
        pushStatus: emailSequences.pushStatus,
      })
      .from(prospects)
      .leftJoin(
        emailSequences,
        and(
          eq(emailSequences.prospectId, prospects.id),
          eq(emailSequences.stepNumber, 1)
        )
      )
      .where(eq(prospects.userId, userId))
      .orderBy(desc(prospects.createdAt));
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
