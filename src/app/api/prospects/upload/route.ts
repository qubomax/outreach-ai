import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { db } from '@/lib/db';
import { prospects, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ensureUser } from '@/lib/auth';
import { PLAN_LIMITS } from '@/lib/stripe';

type CsvRow = Record<string, string>;

function parseName(row: CsvRow): { firstName: string; lastName: string } {
  if (row.first_name || row.last_name) {
    return {
      firstName: (row.first_name || '').trim(),
      lastName: (row.last_name || '').trim(),
    };
  }
  const parts = (row.name || '').trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  };
}

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await ensureUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const text = await file.text();
  const { data, errors } = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
  });

  if (errors.length > 0 && data.length === 0) {
    return NextResponse.json({ error: 'Failed to parse CSV' }, { status: 400 });
  }

  const valid = data.filter((row) => {
    const hasName = row.name || row.first_name;
    return hasName && row.email && row.company;
  });

  if (valid.length === 0) {
    return NextResponse.json(
      { error: 'No valid rows found. Required columns: name (or first_name + last_name), email, company' },
      { status: 400 }
    );
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const plan = user?.plan ?? 'free';
  const limit = PLAN_LIMITS[plan] ?? 0;

  const existing = await db
    .select({ email: prospects.email })
    .from(prospects)
    .where(eq(prospects.userId, userId));
  const existingEmails = new Set(existing.map((r) => r.email.toLowerCase()));

  if (limit === 0) {
    return NextResponse.json(
      { error: 'You need an active plan to upload prospects. Please upgrade on the Account page.' },
      { status: 403 }
    );
  }

  const currentCount = existing.length;
  if (currentCount >= limit) {
    return NextResponse.json(
      { error: `You've reached your ${limit} prospect limit on the ${plan} plan. Upgrade to add more.` },
      { status: 403 }
    );
  }

  const remaining = limit - currentCount;
  const newRows = valid
    .filter((row) => !existingEmails.has(row.email.trim().toLowerCase()))
    .slice(0, remaining);

  if (newRows.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: valid.length });
  }

  const inserted = await db
    .insert(prospects)
    .values(
      newRows.map((row) => {
        const { firstName, lastName } = parseName(row);
        return {
          userId,
          firstName,
          lastName,
          email: row.email.trim(),
          company: row.company.trim(),
          websiteUrl: (row.website_url || row.website || '').trim() || null,
        };
      })
    )
    .returning();

  return NextResponse.json({ inserted: inserted.length, skipped: valid.length - newRows.length });
}
