import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { scrapeWebsite } from '@/lib/jina';
import { getAuthUserId } from '@/lib/auth';

export const maxDuration = 60;

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
        (p.scrapeStatus === 'pending' ||
          (p.scrapeStatus === 'scraping' && p.updatedAt < stuckCutoff) ||
          (force && p.scrapeStatus === 'failed'))
    )
    .slice(0, MAX_PER_CALL);

  if (eligible.length === 0) {
    return NextResponse.json({ scraped: 0 });
  }

  await db
    .update(prospects)
    .set({ scrapeStatus: 'scraping', updatedAt: new Date() })
    .where(inArray(prospects.id, eligible.map((p) => p.id)));

  // Scrape all in parallel
  await Promise.all(
    eligible.map(async (p) => {
      try {
        const text = await scrapeWebsite(p.websiteUrl!);
        await db
          .update(prospects)
          .set({ scrapeStatus: 'scraped', scrapedText: text, updatedAt: new Date() })
          .where(eq(prospects.id, p.id));
      } catch (err) {
        console.error(`Jina scrape failed for prospect ${p.id}:`, err);
        await db
          .update(prospects)
          .set({ scrapeStatus: 'failed', updatedAt: new Date() })
          .where(eq(prospects.id, p.id));
      }
    })
  );

  return NextResponse.json({ scraped: eligible.length });
}
