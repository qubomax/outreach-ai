import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects, emailSequences } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { scrapeWebsite } from '@/lib/jina';
import { generateBrief } from '@/lib/agents/research-agent';
import { generateSequence } from '@/lib/agents/sequence-agent';
import { getUserSettings } from '@/lib/user-settings';
import { getAuthUserId } from '@/lib/auth';

export const maxDuration = 60;

// Process up to 5 prospects per call, each going scrape → generate in parallel
const MAX_PER_CALL = 5;
const STUCK_THRESHOLD_MS = 2 * 60 * 1000;

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prospectIds, force } = await req.json() as { prospectIds: number[]; force?: boolean };

  const rows = await db.select().from(prospects).where(inArray(prospects.id, prospectIds));

  const stuckCutoff = new Date(Date.now() - STUCK_THRESHOLD_MS);

  const eligible = rows
    .filter(
      (p) =>
        p.userId === userId &&
        p.websiteUrl &&
        (
          // Needs scraping
          p.scrapeStatus === 'pending' ||
          (p.scrapeStatus === 'scraping' && p.updatedAt < stuckCutoff) ||
          (force && p.scrapeStatus === 'failed') ||
          // Already scraped but generation failed or pending (catch-up)
          (p.scrapeStatus === 'scraped' &&
            (p.generateStatus === 'pending' || p.generateStatus === 'failed'))
        )
    )
    .slice(0, MAX_PER_CALL);

  if (eligible.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  const settings = await getUserSettings(userId);

  // Mark all that need scraping as scraping (skip already-scraped ones)
  const needsScrape = eligible.filter((p) => p.scrapeStatus !== 'scraped');
  if (needsScrape.length > 0) {
    await db
      .update(prospects)
      .set({ scrapeStatus: 'scraping', updatedAt: new Date() })
      .where(inArray(prospects.id, needsScrape.map((p) => p.id)));
  }

  // Each prospect runs its full pipeline in parallel: scrape → generate
  await Promise.all(
    eligible.map(async (p) => {
      try {
        // Step 1: Scrape (skip if already scraped)
        let text = p.scrapedText;
        if (p.scrapeStatus !== 'scraped' || !text) {
          text = await scrapeWebsite(p.websiteUrl!);
          await db
            .update(prospects)
            .set({ scrapeStatus: 'scraped', scrapedText: text, updatedAt: new Date() })
            .where(eq(prospects.id, p.id));
        }

        // Step 2: Generate brief + sequence immediately
        await db
          .update(prospects)
          .set({ generateStatus: 'generating', updatedAt: new Date() })
          .where(eq(prospects.id, p.id));

        const brief = await generateBrief(text!);
        await db
          .update(prospects)
          .set({ prospectBrief: brief, updatedAt: new Date() })
          .where(eq(prospects.id, p.id));

        const steps = await generateSequence(
          brief,
          p.firstName,
          settings.senderName,
          settings.companyName,
          settings.valueProposition
        );

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
      } catch (err) {
        console.error(`Pipeline failed for prospect ${p.id}:`, err);
        // If scrape failed, mark scrape as failed
        // If generation failed after scrape, mark generate as failed
        const [current] = await db.select({ scrapeStatus: prospects.scrapeStatus })
          .from(prospects).where(eq(prospects.id, p.id)).limit(1);
        if (current?.scrapeStatus !== 'scraped') {
          await db
            .update(prospects)
            .set({ scrapeStatus: 'failed', updatedAt: new Date() })
            .where(eq(prospects.id, p.id));
        } else {
          await db
            .update(prospects)
            .set({ generateStatus: 'failed', updatedAt: new Date() })
            .where(eq(prospects.id, p.id));
        }
      }
    })
  );

  return NextResponse.json({ processed: eligible.length });
}
