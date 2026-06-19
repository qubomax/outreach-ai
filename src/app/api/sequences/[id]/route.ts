import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects, emailSequences } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const prospectId = parseInt(id);

  const [prospect] = await db
    .select()
    .from(prospects)
    .where(and(eq(prospects.id, prospectId), eq(prospects.userId, userId)));

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
