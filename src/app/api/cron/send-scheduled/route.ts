import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, prospects, emailSequences, scheduledEmails } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { sendEmail, hasReply } from '@/lib/gmail';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Find all pending scheduled emails due to send
  const due = await db
    .select()
    .from(scheduledEmails)
    .where(and(eq(scheduledEmails.status, 'pending'), lte(scheduledEmails.sendAt, now)));

  console.log(`[cron/send-scheduled] ${due.length} emails due`);

  const results = { sent: 0, skipped: 0, failed: 0 };

  for (const scheduled of due) {
    try {
      // Fetch user
      const [user] = await db.select().from(users).where(eq(users.id, scheduled.userId));
      if (!user?.gmailAccessToken || !user?.gmailEmail) {
        await db.update(scheduledEmails).set({ status: 'failed' }).where(eq(scheduledEmails.id, scheduled.id));
        results.failed++;
        continue;
      }

      // Fetch prospect
      const [prospect] = await db.select().from(prospects).where(eq(prospects.id, scheduled.prospectId));
      if (!prospect) {
        await db.update(scheduledEmails).set({ status: 'failed' }).where(eq(scheduledEmails.id, scheduled.id));
        results.failed++;
        continue;
      }

      // Fetch email step
      const [step] = await db.select().from(emailSequences).where(eq(emailSequences.id, scheduled.sequenceStepId));
      if (!step) {
        await db.update(scheduledEmails).set({ status: 'failed' }).where(eq(scheduledEmails.id, scheduled.id));
        results.failed++;
        continue;
      }

      const tokens = {
        accessToken: user.gmailAccessToken,
        refreshToken: user.gmailRefreshToken,
        expiry: user.gmailTokenExpiry,
      };

      // Check for reply before sending follow-up
      if (scheduled.gmailThreadId) {
        const replied = await hasReply(scheduled.userId, tokens, scheduled.gmailThreadId);
        if (replied) {
          await db.update(scheduledEmails).set({ status: 'skipped' }).where(eq(scheduledEmails.id, scheduled.id));
          console.log(`[cron] skipped scheduled email ${scheduled.id} — prospect replied`);
          results.skipped++;
          continue;
        }
      }

      const fromAddress = user.senderName
        ? `${user.senderName} <${user.gmailEmail}>`
        : user.gmailEmail;

      const result = await sendEmail(scheduled.userId, tokens, {
        to: prospect.email,
        from: fromAddress,
        subject: step.subject,
        body: step.body,
        threadId: scheduled.gmailThreadId ?? undefined,
      });

      if (!result) {
        await db.update(scheduledEmails).set({ status: 'failed' }).where(eq(scheduledEmails.id, scheduled.id));
        results.failed++;
        continue;
      }

      const sentAt = new Date();
      await db.update(scheduledEmails).set({ status: 'sent', sentAt }).where(eq(scheduledEmails.id, scheduled.id));
      await db
        .update(emailSequences)
        .set({ pushStatus: 'pushed', gmailThreadId: result.threadId, gmailMessageId: result.messageId, sentAt, updatedAt: sentAt })
        .where(eq(emailSequences.id, step.id));

      results.sent++;
    } catch (err) {
      console.error(`[cron] error processing scheduled email ${scheduled.id}:`, err);
      await db.update(scheduledEmails).set({ status: 'failed' }).where(eq(scheduledEmails.id, scheduled.id));
      results.failed++;
    }
  }

  console.log('[cron/send-scheduled] done:', results);
  return NextResponse.json({ ok: true, ...results });
}
