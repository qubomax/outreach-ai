import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  growth: process.env.STRIPE_PRICE_GROWTH!,
  agency: process.env.STRIPE_PRICE_AGENCY!,
} as const;

export const PLAN_LIMITS: Record<string, number> = {
  free: 0,
  starter: 200,
  growth: 1000,
  agency: 5000,
};

export function planFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_GROWTH) return 'growth';
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return 'agency';
  return 'free';
}
