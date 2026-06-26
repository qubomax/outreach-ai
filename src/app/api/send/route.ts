import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, prospects, emailSequences, scheduledEmails } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from '@/lib/gmail';

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prospectId } = await req.json();
  if (!prospectId) {
    return NextResponse.json({ error: 'prospectId required' }, { status: 400 });
  }

  // Fetch user and Gmail tokens
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user?.gmailAccessToken || !user?.gmailEmail) {
    return NextResponse.json(
      { error: 'Gmail not connected. Connect your inbox in Settings.' },
      { status: 400 }
    );
  }

  // Fetch prospect (verify ownership)
  const [prospect] = await db
    .select()
    .from(prospects)
    .where(and(eq(prospects.id, prospectId), eq(prospects.userId, userId)));

  if (!prospect) {
    return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
  }

  // Fetch the 3 email steps
  const steps = await db
    .select()
    .from(emailSequences)
    .where(and(eq(emailSequences.prospectId, prospectId), eq(emailSequences.userId, userId)));

  steps.sort((a, b) => a.stepNumber - b.stepNumber);

  if (steps.length === 0) {
    return NextResponse.json({ error: 'No email sequence found for this prospect' }, { status: 400 });
  }

  const step1 = steps[0];
  const tokens = {
    accessToken: user.gmailAccessToken,
    refreshToken: user.gmailRefreshToken,
    expiry: user.gmailTokenExpiry,
  };

  const fromAddress = user.senderName
    ? `${user.senderName} <${user.gmailEmail}>`
    : user.gmailEmail;

  // Send Email 1 immediately
  const result = await sendEmail(userId, tokens, {
    to: prospect.email,
    from: fromAddress,
    subject: step1.subject,
    body: step1.body,
  });

  if (!result) {
    return NextResponse.json({ error: 'Failed to send email via Gmail. Check your connection in Settings.' }, { status: 500 });
  }

  const now = new Date();

  // Mark Email 1 as sent
  await db
    .update(emailSequences)
    .set({
      pushStatus: 'pushed',
      gmailThreadId: result.threadId,
      gmailMessageId: result.messageId,
      sentAt: now,
      updatedAt: now,
    })
    .where(eq(emailSequences.id, step1.id));

  // Schedule Email 2 and Email 3
  for (const step of steps.slice(1)) {
    const sendAt = new Date(now.getTime() + step.delayDays * 24 * 60 * 60 * 1000);
    await db.insert(scheduledEmails).values({
      userId,
      prospectId,
      sequenceStepId: step.id,
      sendAt,
      status: 'pending',
      gmailThreadId: result.threadId,
    });
  }

  return NextResponse.json({ ok: true, threadId: result.threadId });
}
