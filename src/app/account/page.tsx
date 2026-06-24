import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CheckCircle, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
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
    name: "Growth",
    price: "$149",
    period: "/mo",
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
    name: "Agency",
    price: "$399",
    period: "/mo",
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

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const currentPlan = "Starter"; // hardcoded until Stripe is set up

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
              <p className="font-semibold text-slate-900">{currentPlan} — $49 / mo</p>
              <p className="text-sm text-slate-500">200 prospects per month</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-1">Usage this month</p>
            <p className="text-sm font-medium text-slate-700">7 / 200 prospects</p>
            <div className="mt-1.5 w-40 h-1.5 rounded-full bg-slate-100">
              <div className="h-1.5 rounded-full bg-indigo-500 w-[3.5%]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Available Plans</h2>
        <div className="grid grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const isCurrent = plan.name === currentPlan;
            return (
              <div
                key={plan.name}
                className={`rounded-xl border flex flex-col p-6 ${
                  plan.highlight
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-lg"
                    : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-2">
                    Most popular
                  </span>
                )}
                <h3 className={`font-bold text-lg mb-1 ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-0.5 mb-5">
                  <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle
                        className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? "text-indigo-300" : "text-indigo-500"}`}
                      />
                      <span className={plan.highlight ? "text-indigo-100" : "text-slate-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div
                    className={`text-center text-sm font-medium py-2.5 rounded-lg ${
                      plan.highlight
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    Current plan
                  </div>
                ) : (
                  <Button
                    disabled
                    className={`w-full text-sm font-medium ${
                      plan.highlight
                        ? "bg-white text-indigo-600 hover:bg-indigo-50"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    Upgrade — coming soon
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-4 text-center">
          Billing powered by Stripe — coming soon. Contact us to upgrade early.
        </p>
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
            <span className="text-slate-500">User ID</span>
            <span className="text-slate-400 font-mono text-xs">{userId}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
