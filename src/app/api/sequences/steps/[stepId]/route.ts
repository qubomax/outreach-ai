import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailSequences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const { stepId } = await params;
  const { subject, body } = await req.json() as { subject: string; body: string };

  await db
    .update(emailSequences)
    .set({ subject, body, updatedAt: new Date() })
    .where(eq(emailSequences.id, parseInt(stepId)));

  return NextResponse.json({ ok: true });
}
