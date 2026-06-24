import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return NextResponse.json({});

  return NextResponse.json({
    apifyApiKey: user.apifyApiKey ?? '',
    instantlyApiKey: user.instantlyApiKey ?? '',
    instantlyCampaignId: user.instantlyCampaignId ?? '',
    senderName: user.senderName ?? '',
    companyName: user.companyName ?? '',
    valueProposition: user.valueProposition ?? '',
  });
}

export async function PATCH(req: NextRequest) {
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const allowed = ['apifyApiKey', 'instantlyApiKey', 'instantlyCampaignId', 'senderName', 'companyName', 'valueProposition'] as const;
  const update: Partial<Record<typeof allowed[number], string>> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  await db
    .update(users)
    .set({ ...update, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
