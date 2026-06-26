import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { startScrape } from '@/lib/apify';
import { getAuthUserId } from '@/lib/auth';
import { getUserSettings } from '@/lib/user-settings';

// POST /api/scrape  body: { prospectIds: number[] }
// Only starts ONE Apify run — the next pending prospect.
// The frontend triggers this again after each run completes to process the queue.
export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prospectIds, force } = await req.json() as { prospectIds: number[]; force?: boolean };
  const { apifyApiKey: apiKey } = await getUserSettings(userId);

  const rows = await db
    .select()
    .from(prospects)
    .where(inArray(prospects.id, prospectIds));

  const alreadyScraping = rows.some((p) => p.scrapeStatus === 'scraping');
  if (alreadyScraping) {
    return NextResponse.json({ started: 0, queued: rows.filter((p) => p.scrapeStatus === 'pending').length });
  }

  const eligible = rows.filter(
    (p) => p.userId === userId && p.websiteUrl && (p.scrapeStatus === 'pending' || (force && p.scrapeStatus === 'failed'))
  );

  if (eligible.length === 0) {
    return NextResponse.json({ started: 0, queued: 0 });
  }

  const p = eligible[0];

  try {
    await db
      .update(prospects)
      .set({ scrapeStatus: 'scraping', updatedAt: new Date() })
      .where(eq(prospects.id, p.id));

    const runId = await startScrape(p.websiteUrl!, apiKey);

    await db
      .update(prospects)
      .set({ apifyJobId: runId, updatedAt: new Date() })
      .where(eq(prospects.id, p.id));

    return NextResponse.json({ started: 1, queued: eligible.length - 1 });
  } catch (err) {
    console.error(`Apify start failed for prospect ${p.id}:`, err);
    await db
      .update(prospects)
      .set({ scrapeStatus: 'failed', updatedAt: new Date() })
      .where(eq(prospects.id, p.id));
    return NextResponse.json({ started: 0, failed: 1, error: String(err) });
  }
}
