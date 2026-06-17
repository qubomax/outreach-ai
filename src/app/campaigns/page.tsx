import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Mail, MousePointerClick, Reply } from "lucide-react";

const DUMMY_CAMPAIGNS = [
  {
    id: "1",
    name: "Dev Tools Outreach — June 2025",
    prospects: 3,
    sent: 9,
    openRate: "61%",
    clickRate: "18%",
    replyRate: "14%",
    status: "active",
    createdAt: "Jun 13, 2025",
  },
  {
    id: "2",
    name: "SaaS Founders — Batch 1",
    prospects: 12,
    sent: 36,
    openRate: "54%",
    clickRate: "12%",
    replyRate: "9%",
    status: "active",
    createdAt: "Jun 10, 2025",
  },
  {
    id: "3",
    name: "Early Test — May 2025",
    prospects: 5,
    sent: 15,
    openRate: "47%",
    clickRate: "8%",
    replyRate: "7%",
    status: "completed",
    createdAt: "May 28, 2025",
  },
];

export default function CampaignsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Campaigns</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Performance data pulled from Instantly.ai
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Avg Open Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">54%</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <MousePointerClick className="w-3.5 h-3.5" /> Avg Click Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">13%</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Reply className="w-3.5 h-3.5" /> Avg Reply Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">10%</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign list */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px_80px_100px] gap-4 px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wide">
          <div>Campaign</div>
          <div className="text-center">Sent</div>
          <div className="text-center">Opens</div>
          <div className="text-center">Clicks</div>
          <div className="text-center">Replies</div>
          <div>Status</div>
        </div>

        {DUMMY_CAMPAIGNS.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-[1fr_80px_80px_80px_80px_100px] gap-4 px-4 py-3.5 border-b border-zinc-800 last:border-0 hover:bg-zinc-900/60 items-center"
          >
            <div>
              <p className="text-sm font-medium text-white">{c.name}</p>
              <p className="text-xs text-zinc-500">
                {c.prospects} prospects · Created {c.createdAt}
              </p>
            </div>
            <div className="text-center text-sm text-zinc-300">{c.sent}</div>
            <div className="text-center text-sm text-zinc-300">{c.openRate}</div>
            <div className="text-center text-sm text-zinc-300">{c.clickRate}</div>
            <div className="text-center text-sm font-medium text-emerald-400">{c.replyRate}</div>
            <div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  c.status === "active"
                    ? "bg-emerald-900 text-emerald-300"
                    : "bg-zinc-700 text-zinc-400"
                }`}
              >
                {c.status === "active" ? "Active" : "Completed"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
