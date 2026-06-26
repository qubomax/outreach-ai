import { Mail } from "lucide-react";
import Link from "next/link";

export default function CampaignsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Outreach</h1>
        <p className="text-slate-500 text-sm mt-1">Track your sent sequences and reply activity</p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center shadow-sm">
        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-5 h-5 text-indigo-500" />
        </div>
        <p className="text-sm font-medium text-slate-700 mb-1">Direct sending coming soon</p>
        <p className="text-sm text-slate-400 mb-4">
          Connect your Gmail inbox in Settings to send sequences directly from Cold Hero.
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Go to Settings →
        </Link>
      </div>
    </div>
  );
}
