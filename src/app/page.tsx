import { DUMMY_PROSPECTS, DUMMY_STATS } from "@/lib/dummy-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Mail, Send, TrendingUp, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  scraping: "Scraping...",
  generating: "Generating...",
  ready: "Ready",
  pushed: "Pushed",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-zinc-700 text-zinc-300",
  scraping: "bg-yellow-900 text-yellow-300",
  generating: "bg-blue-900 text-blue-300",
  ready: "bg-emerald-900 text-emerald-300",
  pushed: "bg-indigo-900 text-indigo-300",
};

export default function DashboardPage() {
  const recent = DUMMY_PROSPECTS.slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Your outreach pipeline at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Prospects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{DUMMY_STATS.totalProspects}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Sequences Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{DUMMY_STATS.sequencesGenerated}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Send className="w-3.5 h-3.5" /> Pushed to Instantly
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{DUMMY_STATS.pushedToInstantly}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Avg Reply Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">{DUMMY_STATS.avgReplyRate}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-6 flex items-center justify-between">
        <div>
          <p className="font-medium text-white">Upload a new prospect list</p>
          <p className="text-sm text-zinc-400 mt-0.5">CSV with name, email, company, website URL</p>
        </div>
        <Link href="/prospects">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
            Upload CSV <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-200">Recent Prospects</h2>
          <Link href="/prospects" className="text-xs text-indigo-400 hover:text-indigo-300">
            View all
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          {recent.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between px-4 py-3 ${
                i < recent.length - 1 ? "border-b border-zinc-800" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-300">
                  {p.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-zinc-500">{p.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                  {STATUS_LABELS[p.status]}
                </span>
                {p.status === "ready" && (
                  <Link href={`/sequences/${p.id}`}>
                    <Button size="sm" variant="ghost" className="text-xs text-indigo-400 hover:text-indigo-300 h-7">
                      View sequence
                    </Button>
                  </Link>
                )}
                {(p.status === "scraping" || p.status === "generating") && (
                  <Clock className="w-3.5 h-3.5 text-zinc-500 animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
