import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects, emailSequences } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { generateBrief } from '@/lib/agents/research-agent';
import { generateSequence } from '@/lib/agents/sequence-agent';
import { getAuthUserId } from '@/lib/auth';
import { getUserSettings } from '@/lib/user-settings';

export async function POST() {
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const eligible = await db
    .select()
    .from(prospects)
    .where(
      and(
        eq(prospects.userId, userId),
        eq(prospects.scrapeStatus, 'scraped'),
        eq(prospects.generateStatus, 'pending')
      )
    );

  if (eligible.length === 0) {
    return NextResponse.json({ generated: 0 });
  }

  const settings = await getUserSettings(userId);

  await db
    .update(prospects)
    .set({ generateStatus: 'generating', updatedAt: new Date() })
    .where(inArray(prospects.id, eligible.map((p) => p.id)));

  let generated = 0;
  await Promise.all(
    eligible.map(async (p) => {
      try {
        const brief = await generateBrief(p.scrapedText!);

        await db
          .update(prospects)
          .set({ prospectBrief: brief, updatedAt: new Date() })
          .where(eq(prospects.id, p.id));

        const steps = await generateSequence(brief, p.firstName, settings.senderName, settings.companyName, settings.valueProposition);

        await db.insert(emailSequences).values(
          steps.map((s) => ({
            prospectId: p.id,
            userId,
            stepNumber: s.stepNumber,
            subject: s.subject,
            body: s.body,
            delayDays: s.delayDays,
          }))
        );

        await db
          .update(prospects)
          .set({ generateStatus: 'generated', updatedAt: new Date() })
          .where(eq(prospects.id, p.id));

        generated++;
      } catch (err) {
        console.error(`Generation failed for prospect ${p.id}:`, err);
        await db
          .update(prospects)
          .set({ generateStatus: 'failed', updatedAt: new Date() })
          .where(eq(prospects.id, p.id));
      }
    })
  );

  return NextResponse.json({ generated });
}
