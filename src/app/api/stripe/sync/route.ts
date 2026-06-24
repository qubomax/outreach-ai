import { NextResponse } from 'next/server';
import { stripe, planFromPriceId } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ensureUser } from '@/lib/auth';

export async function POST() {
  let userId: string;
  try {
    userId = await ensureUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // If no Stripe customer yet, check by email
  let customerId = user.stripeCustomerId;
  if (!customerId && user.email) {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
  }

  if (!customerId) {
    return NextResponse.json({ plan: 'free', synced: false });
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    await db.update(users).set({
      stripeCustomerId: customerId,
      plan: 'free',
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
    return NextResponse.json({ plan: 'free', synced: true });
  }

  const sub = subscriptions.data[0];
  const priceId = sub.items.data[0].price.id;
  const plan = planFromPriceId(priceId);

  await db.update(users).set({
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    plan,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));

  return NextResponse.json({ plan, synced: true });
}
