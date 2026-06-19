import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MousePointerClick, Reply } from "lucide-react";

interface InstantlyCampaign {
  id: string;
  name: string;
  status: number;
}

interface InstantlyAnalytics {
  campaign_id: string;
  campaign_name: string;
  total_sent: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
}

async function getCampaigns(): Promise<{ campaigns: InstantlyCampaign[]; analytics: InstantlyAnalytics[] }> {
  const apiKey = process.env.INSTANTLY_API_KEY!;
  const headers = { Authorization: `Bearer ${apiKey}` };

  const [campaignsRes, analyticsRes] = await Promise.all([
    fetch('https://api.instantly.ai/api/v2/campaigns?limit=20', { headers, cache: 'no-store' }),
    fetch('https://api.instantly.ai/api/v2/campaigns/analytics/overview?limit=20', { headers, cache: 'no-store' }),
  ]);

  const campaigns = campaignsRes.ok ? (await campaignsRes.json()).items ?? [] : [];
  const analytics = analyticsRes.ok ? (await analyticsRes.json()).data ?? [] : [];

  return { campaigns, analytics };
}

function fmt(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

export default async function CampaignsPage() {
  const { campaigns, analytics } = await getCampaigns();

  const avgOpen = analytics.length
    ? analytics.reduce((s, a) => s + (a.open_rate ?? 0), 0) / analytics.length
    : null;
  const avgClick = analytics.length
    ? analytics.reduce((s, a) => s + (a.click_rate ?? 0), 0) / analytics.length
    : null;
  const avgReply = analytics.length
    ? analytics.reduce((s, a) => s + (a.reply_rate ?? 0), 0) / analytics.length
    : null;

  const analyticsById = Object.fromEntries(analytics.map((a) => [a.campaign_id, a]));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
        <p className="text-slate-500 text-sm mt-1">
          Performance data pulled from Instantly.ai
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Avg Open Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {avgOpen !== null ? fmt(avgOpen) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-2">
              <MousePointerClick className="w-3.5 h-3.5" /> Avg Click Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {avgClick !== null ? fmt(avgClick) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-2">
              <Reply className="w-3.5 h-3.5" /> Avg Reply Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">
              {avgReply !== null ? fmt(avgReply) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-400 shadow-sm">
          No campaigns yet — push prospects to Instantly to create one.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <div>Campaign</div>
            <div className="text-center">Opens</div>
            <div className="text-center">Clicks</div>
            <div className="text-center">Replies</div>
            <div>Status</div>
          </div>

          {campaigns.map((c, i) => {
            const a = analyticsById[c.id];
            const isActive = c.status === 1;
            return (
              <div
                key={c.id}
                className={`grid grid-cols-[1fr_80px_80px_80px_100px] gap-4 px-4 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 items-center transition-colors`}
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{c.name}</p>
                </div>
                <div className="text-center text-sm text-slate-600">
                  {a ? fmt(a.open_rate) : "—"}
                </div>
                <div className="text-center text-sm text-slate-600">
                  {a ? fmt(a.click_rate) : "—"}
                </div>
                <div className="text-center text-sm font-medium text-emerald-600">
                  {a ? fmt(a.reply_rate) : "—"}
                </div>
                <div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isActive
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isActive ? "Active" : "Draft"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
