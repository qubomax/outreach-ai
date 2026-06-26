import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prospects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/scrape/[prospectId] — returns current prospect state from DB
// No longer polls Apify — scraping is synchronous via Jina Reader
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  const { prospectId } = await params;
  const id = parseInt(prospectId, 10);
  const [prospect] = await db.select().from(prospects).where(eq(prospects.id, id)).limit(1);
  if (!prospect) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(prospect);
}
