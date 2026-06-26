import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { scrapeWebsite } from '@/lib/jina';
import { getAuthUserId } from '@/lib/auth';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prospectIds, force } = await req.json() as { prospectIds: number[]; force?: boolean };

  const rows = await db.select().from(prospects).where(inArray(prospects.id, prospectIds));

  const eligible = rows.filter(
    (p) => p.userId === userId && p.websiteUrl &&
      (p.scrapeStatus === 'pending' || (force && p.scrapeStatus === 'failed'))
  );

  if (eligible.length === 0) {
    return NextResponse.json({ scraped: 0 });
  }

  // Mark all as scraping
  await db
    .update(prospects)
    .set({ scrapeStatus: 'scraping', updatedAt: new Date() })
    .where(inArray(prospects.id, eligible.map((p) => p.id)));

  // Scrape in batches of 5 to avoid Jina rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const batch = eligible.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (p) => {
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
    // Small delay between batches
    if (i + BATCH_SIZE < eligible.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return NextResponse.json({ scraped: eligible.length });
}
