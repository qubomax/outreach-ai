import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects, emailSequences } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { pushLeadToCampaign } from '@/lib/instantly';
import { getAuthUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prospectId } = await req.json() as { prospectId: number };

  const [prospect] = await db
    .select()
    .from(prospects)
    .where(and(eq(prospects.id, prospectId), eq(prospects.userId, userId)));

  if (!prospect) {
    return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
  }

  const steps = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.prospectId, prospectId))
    .orderBy(asc(emailSequences.stepNumber));

  if (steps.length === 0) {
    return NextResponse.json({ error: 'No email sequence found' }, { status: 400 });
  }

  const apiKey = process.env.INSTANTLY_API_KEY!;
  const campaignId = process.env.INSTANTLY_CAMPAIGN_ID!;

  await pushLeadToCampaign(apiKey, campaignId, {
    email: prospect.email,
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    company: prospect.company,
    personalization: steps[0].body,
  });

  await db
    .update(emailSequences)
    .set({ pushStatus: 'pushed', updatedAt: new Date() })
    .where(eq(emailSequences.prospectId, prospectId));

  return NextResponse.json({ ok: true });
}
