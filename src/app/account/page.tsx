import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CheckCircle, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_LIMITS, stripe, planFromPriceId } from "@/lib/stripe";
import UpgradeButton from "./upgrade-button";
import ManageBillingButton from "./manage-billing-button";

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: "$49",
    prospects: 200,
    features: [
      "200 prospects / month",
      "AI prospect research",
      "3-step email sequences",
      "Instantly.ai push",
      "Sequence editor",
      "Email support",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    price: "$149",
    prospects: 1000,
    features: [
      "1,000 prospects / month",
      "Everything in Starter",
      "Priority processing",
      "Bulk push",
      "Priority email support",
    ],
    highlight: true,
  },
  {
    key: "agency",
    name: "Agency",
    price: "$399",
    prospects: 5000,
    features: [
      "5,000 prospects / month",
      "Everything in Growth",
      "Multiple campaigns",
      "API access",
      "Dedicated support",
    ],
  },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
  agency: "Agency",
};

const PLAN_PRICES: Record<string, string> = {
  free: "$0",
  starter: "$49",
  growth: "$149",
  agency: "$399",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const params = await searchParams;

  let [user] = await db.select().from(users).where(eq(users.id, userId));

  // Auto-sync from Stripe when redirected back after checkout
  if (params.success === "true") {
    let customerId = user.stripeCustomerId;
    if (!customerId && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }
    if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
      if (subs.data.length > 0) {
        const sub = subs.data[0];
        const priceId = sub.items.data[0].price.id;
        const newPlan = planFromPriceId(priceId);
        await db.update(users).set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          plan: newPlan,
          updatedAt: new Date(),
        }).where(eq(users.id, userId));
        // Re-fetch updated user
        [user] = await db.select().from(users).where(eq(users.id, userId));
      }
    }
  }

  const plan = user?.plan ?? "free";
  const limit = PLAN_LIMITS[plan] ?? 0;

  const prospectCount = await db
    .select({ id: prospects.id })
    .from(prospects)
    .where(eq(prospects.userId, userId));
  const used = prospectCount.length;

  const hasSubscription = !!user?.stripeCustomerId;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your plan and billing</p>
      </div>

      {/* Current plan summary */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {PLAN_LABELS[plan]} — {PLAN_PRICES[plan]} / mo
              </p>
              <p className="text-sm text-slate-500">
                {limit > 0 ? `${limit} prospects per month` : "No active plan"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {limit > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-1">Usage this month</p>
                <p className="text-sm font-medium text-slate-700">{used} / {limit} prospects</p>
                <div className="mt-1.5 w-40 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            {hasSubscription && <ManageBillingButton />}
          </div>
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Available Plans</h2>
        <div className="grid grid-cols-3 gap-5">
          {PLANS.map((p) => {
            const isCurrent = p.key === plan;
            return (
              <div
                key={p.key}
                className={`rounded-xl border flex flex-col p-6 ${
                  p.highlight
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-lg"
                    : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                {p.highlight && (
                  <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-2">
                    Most popular
                  </span>
                )}
                <h3 className={`font-bold text-lg mb-1 ${p.highlight ? "text-white" : "text-slate-900"}`}>
                  {p.name}
                </h3>
                <div className="flex items-baseline gap-0.5 mb-5">
                  <span className={`text-4xl font-bold ${p.highlight ? "text-white" : "text-slate-900"}`}>
                    {p.price}
                  </span>
                  <span className={`text-sm ${p.highlight ? "text-indigo-200" : "text-slate-400"}`}>/mo</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle
                        className={`w-4 h-4 mt-0.5 shrink-0 ${p.highlight ? "text-indigo-300" : "text-indigo-500"}`}
                      />
                      <span className={p.highlight ? "text-indigo-100" : "text-slate-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div
                    className={`text-center text-sm font-medium py-2.5 rounded-lg ${
                      p.highlight ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    Current plan
                  </div>
                ) : (
                  <UpgradeButton
                    plan={p.key as "starter" | "growth" | "agency"}
                    highlight={!!p.highlight}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Account info */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Email</span>
            <span className="text-slate-900 font-medium">{user?.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Plan</span>
            <span className="text-slate-900 font-medium capitalize">{plan}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">User ID</span>
            <span className="text-slate-400 font-mono text-xs">{userId}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
