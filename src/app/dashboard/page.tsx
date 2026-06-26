import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { prospects, emailSequences, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Mail, Send, TrendingUp, ArrowRight, Clock, BarChart2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getCampaignStats } from "@/lib/instantly";
import { getUserSettings } from "@/lib/user-settings";

function getDisplayStatus(p: { scrapeStatus: string; generateStatus: string }): string {
  if (p.generateStatus === "generated") return "ready";
  if (p.generateStatus === "generating") return "generating";
  if (p.scrapeStatus === "scraping") return "scraping";
  if (p.generateStatus === "failed" || p.scrapeStatus === "failed") return "failed";
  if (p.scrapeStatus === "scraped") return "scraped";
  return "pending";
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  scraping: "Scraping...",
  scraped: "Scraped",
  generating: "Generating...",
  ready: "Ready",
  pushed: "Pushed",
  failed: "Failed",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-500",
  scraping: "bg-amber-50 text-amber-600",
  scraped: "bg-slate-100 text-slate-600",
  generating: "bg-blue-50 text-blue-600",
  ready: "bg-emerald-50 text-emerald-600",
  pushed: "bg-indigo-50 text-indigo-600",
  failed: "bg-red-50 text-red-500",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const [allProspects, pushedSequences, settings] = await Promise.all([
    db.select().from(prospects).where(eq(prospects.userId, userId)).orderBy(desc(prospects.createdAt)),
    db.select().from(emailSequences).where(
      and(eq(emailSequences.userId, userId), eq(emailSequences.pushStatus, "pushed"), eq(emailSequences.stepNumber, 1))
    ),
    getUserSettings(userId),
  ]);

  const total = allProspects.length;
  const sequencesGenerated = allProspects.filter((p) => p.generateStatus === "generated").length;
  const pushedCount = pushedSequences.length;
  const recent = allProspects.slice(0, 5);

  const campaignStats =
    settings.instantlyApiKey && settings.instantlyCampaignId
      ? await getCampaignStats(settings.instantlyApiKey, settings.instantlyCampaignId)
      : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Your outreach pipeline at a glance</p>
      </div>

      {/* Onboarding banner */}
      {(!settings.apifyApiKey || !settings.instantlyApiKey || !settings.instantlyCampaignId) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800">
              Complete your setup — add your Apify and Instantly API keys to start generating sequences.
            </p>
          </div>
          <Link href="/settings">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs shrink-0 ml-4">
              Go to Settings
            </Button>
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Prospects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{total}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Sequences Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{sequencesGenerated}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-2">
              <Send className="w-3.5 h-3.5" /> Pushed to Instantly
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{pushedCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Reply Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaignStats ? (
              <p className="text-3xl font-bold text-slate-900">{campaignStats.replyRate}%</p>
            ) : (
              <a
                href="https://app.instantly.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-1"
              >
                View in Instantly <ArrowRight className="w-3 h-3" />
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instantly campaign stats */}
      {campaignStats ? (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-500" /> Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-slate-400 mb-1">Emails Sent</p>
                <p className="text-2xl font-bold text-slate-900">{campaignStats.emailsSent}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Opens</p>
                <p className="text-2xl font-bold text-slate-900">{campaignStats.openCount}</p>
                <p className="text-xs text-slate-400 mt-0.5">{campaignStats.openRate}% open rate</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Replies</p>
                <p className="text-2xl font-bold text-slate-900">{campaignStats.replyCount}</p>
                <p className="text-xs text-slate-400 mt-0.5">{campaignStats.replyRate}% reply rate</p>
              </div>
              <div className="flex items-center">
                <Link
                  href="/campaigns"
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  View campaign details <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        settings.instantlyApiKey && settings.instantlyCampaignId ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">Analytics API not available on your current Instantly plan.</p>
            <a href="https://app.instantly.ai" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="text-xs border-slate-300 gap-1">
                View in Instantly <ArrowRight className="w-3 h-3" />
              </Button>
            </a>
          </div>
        ) : !settings.instantlyApiKey && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">Add your Instantly API key in Settings to see campaign stats.</p>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="text-xs border-slate-300">Go to Settings</Button>
            </Link>
          </div>
        )
      )}

      {/* Upload CTA */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900">Upload a new prospect list</p>
          <p className="text-sm text-slate-500 mt-0.5">CSV with name, email, company, website URL</p>
        </div>
        <Link href="/prospects">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm">
            Upload CSV <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Recent prospects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Recent Prospects</h2>
          <Link href="/prospects" className="text-xs text-indigo-600 hover:text-indigo-700">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
            No prospects yet — upload a CSV to get started.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {recent.map((p, i) => {
              const status = getDisplayStatus(p);
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i < recent.length - 1 ? "border-b border-slate-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                      {p.firstName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{p.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                    {status === "ready" && (
                      <Link href={`/sequences/${p.id}`}>
                        <Button size="sm" variant="ghost" className="text-xs text-indigo-600 hover:text-indigo-700 h-7">
                          View sequence
                        </Button>
                      </Link>
                    )}
                    {(status === "scraping" || status === "generating") && (
                      <Clock className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
