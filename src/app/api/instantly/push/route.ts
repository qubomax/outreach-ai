import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects, emailSequences } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { setupCampaignSequence, pushLeadToCampaign } from '@/lib/instantly';
import { getAuthUserId } from '@/lib/auth';
import { getUserSettings } from '@/lib/user-settings';

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

  const { instantlyApiKey: apiKey, instantlyCampaignId: campaignId } = await getUserSettings(userId);

  if (!apiKey || !campaignId) {
    return NextResponse.json(
      { error: 'Instantly API key and Campaign ID are required. Add them in Settings.' },
      { status: 400 }
    );
  }

  const emailSteps = steps.map((s) => ({
    subject: s.subject,
    body: s.body,
    delayDays: s.delayDays,
  }));

  // Set up the campaign sequence template with variable placeholders
  await setupCampaignSequence(apiKey, campaignId, emailSteps);

  // Push the lead with all email content as custom variables
  await pushLeadToCampaign(apiKey, campaignId, {
    email: prospect.email,
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    company: prospect.company,
    emails: emailSteps,
  });

  await db
    .update(emailSequences)
    .set({ pushStatus: 'pushed', updatedAt: new Date() })
    .where(eq(emailSequences.prospectId, prospectId));

  return NextResponse.json({ ok: true });
}
