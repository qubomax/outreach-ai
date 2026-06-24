import Link from "next/link";
import { ArrowRight, Zap, Upload, Brain, Send, CheckCircle } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

const STEPS = [
  {
    icon: Upload,
    title: "Upload your prospect list",
    description:
      "Drop a CSV with name, email, company, and website URL. Export it from Apollo, LinkedIn, or your CRM.",
  },
  {
    icon: Brain,
    title: "AI researches and writes",
    description:
      "We scrape each company website, generate a 150-word prospect brief, then write a hyper-personalized 3-step email sequence per contact — automatically.",
  },
  {
    icon: Send,
    title: "Push to Instantly in one click",
    description:
      "Review and edit sequences in the editor, then push approved leads straight to your Instantly.ai campaign. We handle the research and writing. Instantly handles the sending.",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "$49",
    prospects: "200 prospects / mo",
    features: ["AI prospect research", "3-step sequences", "Instantly.ai push", "Sequence editor"],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$149",
    prospects: "1,000 prospects / mo",
    features: ["Everything in Starter", "Priority processing", "Bulk push", "Email support"],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Agency",
    price: "$399",
    prospects: "5,000 prospects / mo",
    features: ["Everything in Growth", "Multiple campaigns", "API access", "Dedicated support"],
    cta: "Contact us",
    highlight: false,
  },
];

const BEFORE_AFTER = [
  {
    label: "Generic — 1% reply rate",
    text: `Hi [First Name],\n\nI hope this email finds you well. I wanted to reach out about our solution that helps companies like yours achieve their goals.\n\nWould you be open to a quick call?`,
    type: "before",
  },
  {
    label: "Personalized — 15–20% reply rate",
    text: `Hi Sarah,\n\nNoticed Loomstack just launched an enterprise tier last month — looks like you're making a push upmarket. We help sales teams at exactly that stage do personalized outbound at scale.\n\nWorth a quick chat?`,
    type: "after",
  },
];

export default async function LandingPage() {
  const { userId } = await auth();
  const isLoggedIn = !!userId;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold text-slate-900 tracking-tight">
            outreach<span className="text-indigo-500">-ai</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#how-it-works" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            How it works
          </a>
          <a href="#pricing" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Pricing
          </a>
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              Go to app <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3 h-3" /> Powered by Claude AI + Apify
        </div>
        <h1 className="text-5xl font-bold text-slate-900 leading-tight tracking-tight mb-6">
          Cold email that actually sounds{" "}
          <span className="text-indigo-600">like you did your homework</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload a CSV of prospects. We research every company, write a personalized 3-step
          email sequence per contact, and push it to Instantly.ai — in minutes, not days.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href={isLoggedIn ? "/dashboard" : "/sign-up"}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm shadow-sm"
          >
            {isLoggedIn ? "Go to app" : "Start free trial"} <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#how-it-works"
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            See how it works →
          </a>
        </div>
      </section>

      {/* Before / After */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-2 gap-6">
          {BEFORE_AFTER.map((item) => (
            <div
              key={item.type}
              className={`rounded-xl border p-6 ${
                item.type === "after"
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <p
                className={`text-xs font-semibold mb-3 uppercase tracking-wide ${
                  item.type === "after" ? "text-indigo-600" : "text-slate-400"
                }`}
              >
                {item.label}
              </p>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {item.text}
              </pre>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-50 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">How it works</h2>
          <p className="text-slate-500 text-center mb-16 max-w-xl mx-auto">
            From CSV to campaign-ready sequences in minutes. No manual research, no prompt
            engineering, no copy-pasting between tools.
          </p>
          <div className="grid grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                  <step.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-xs font-semibold text-indigo-500 mb-2 uppercase tracking-wide">
                  Step {i + 1}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Simple pricing</h2>
          <p className="text-slate-500 text-center mb-16">
            No setup fees. No contracts. Cancel anytime.
          </p>
          <div className="grid grid-cols-3 gap-6">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.highlight
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-lg"
                    : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <div className="text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-2">
                    Most popular
                  </div>
                )}
                <h3 className={`font-bold text-lg mb-1 ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>/mo</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}>
                  {plan.prospects}
                </p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle
                        className={`w-4 h-4 shrink-0 ${plan.highlight ? "text-indigo-300" : "text-indigo-500"}`}
                      />
                      <span className={plan.highlight ? "text-indigo-100" : "text-slate-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className={`text-center text-sm font-medium py-2.5 rounded-lg transition-colors ${
                    plan.highlight
                      ? "bg-white text-indigo-600 hover:bg-indigo-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span className="font-medium text-slate-600">outreach-ai</span>
        </div>
        <p>© {new Date().getFullYear()} outreach-ai. All rights reserved.</p>
      </footer>
    </div>
  );
}
