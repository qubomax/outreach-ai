import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICE_IDS } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';
import { ensureUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await ensureUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { plan } = await req.json() as { plan: 'starter' | 'growth' | 'agency' };
  const priceId = PRICE_IDS[plan];
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  // ensureUser() already created the row — re-fetch it
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  // Fallback: get email from Clerk if DB row somehow missing
  let customerEmail = user?.email;
  let existingCustomerId = user?.stripeCustomerId;
  if (!customerEmail) {
    const clerkUser = await currentUser();
    customerEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? '';
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: existingCustomerId ? undefined : customerEmail,
    customer: existingCustomerId || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/account?success=true`,
    cancel_url: `${baseUrl}/account?canceled=true`,
    metadata: { userId, plan },
    subscription_data: { metadata: { userId, plan } },
  });

  return NextResponse.json({ url: session.url });
}
