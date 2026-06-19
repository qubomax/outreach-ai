import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects, emailSequences } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { DEV_USER_ID } from '@/lib/dev-user';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prospectId = parseInt(id);

  const [prospect] = await db
    .select()
    .from(prospects)
    .where(and(eq(prospects.id, prospectId), eq(prospects.userId, DEV_USER_ID)));

  if (!prospect) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const steps = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.prospectId, prospectId))
    .orderBy(asc(emailSequences.stepNumber));

  return NextResponse.json({ prospect, steps });
}
