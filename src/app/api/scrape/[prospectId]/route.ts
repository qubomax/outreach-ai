import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getRunStatus, getRunText } from '@/lib/apify';

// GET /api/scrape/[prospectId] — poll Apify status, update DB when done
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  const { prospectId } = await params;
  const id = parseInt(prospectId, 10);
  const apiKey = process.env.APIFY_API_KEY!;

  const [prospect] = await db.select().from(prospects).where(eq(prospects.id, id)).limit(1);
  if (!prospect) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Already resolved — nothing to poll
  if (prospect.scrapeStatus !== 'scraping' || !prospect.apifyJobId) {
    return NextResponse.json(prospect);
  }

  const status = await getRunStatus(prospect.apifyJobId, apiKey);

  if (status === 'SUCCEEDED') {
    const text = await getRunText(prospect.apifyJobId, apiKey);
    const [updated] = await db
      .update(prospects)
      .set({ scrapeStatus: 'scraped', scrapedText: text, updatedAt: new Date() })
      .where(eq(prospects.id, id))
      .returning();
    return NextResponse.json(updated);
  }

  if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
    const [updated] = await db
      .update(prospects)
      .set({ scrapeStatus: 'failed', updatedAt: new Date() })
      .where(eq(prospects.id, id))
      .returning();
    return NextResponse.json(updated);
  }

  // Still running
  return NextResponse.json(prospect);
}
