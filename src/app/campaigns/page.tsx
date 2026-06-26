import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { prospects, emailSequences, scheduledEmails } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Send, Clock, CheckCircle, SkipForward } from "lucide-react";
import Link from "next/link";

const STEP_STATUS_LABEL: Record<string, string> = {
  pending: "Scheduled",
  sent: "Sent",
  skipped: "Replied",
  failed: "Failed",
};

const STEP_STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  sent: "bg-indigo-50 text-indigo-600",
  skipped: "bg-emerald-50 text-emerald-600",
  failed: "bg-red-50 text-red-500",
};

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function CampaignsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  // Fetch all sent Email 1s (step 1 with pushStatus='pushed')
  const sentStep1s = await db
    .select()
    .from(emailSequences)
    .where(
      and(
        eq(emailSequences.userId, userId),
        eq(emailSequences.stepNumber, 1),
        eq(emailSequences.pushStatus, "pushed")
      )
    );

  if (sentStep1s.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Outreach</h1>
          <p className="text-slate-500 text-sm mt-1">Track your sent sequences and reply activity</p>
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Send className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">No sequences sent yet</p>
          <p className="text-sm text-slate-400 mb-4">
            Go to Sequences, open a generated sequence, and hit Send.
          </p>
          <Link
            href="/sequences"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View sequences →
          </Link>
        </div>
      </div>
    );
  }

  const prospectIds = sentStep1s.map((s) => s.prospectId);

  // Fetch all prospects and scheduled follow-ups for these prospect IDs
  const [allProspects, followUps] = await Promise.all([
    db.select().from(prospects).where(eq(prospects.userId, userId)),
    db.select().from(scheduledEmails).where(eq(scheduledEmails.userId, userId)),
  ]);

  const prospectMap = Object.fromEntries(allProspects.map((p) => [p.id, p]));
  const followUpsByProspect = followUps.reduce<Record<number, typeof followUps>>((acc, f) => {
    if (!acc[f.prospectId]) acc[f.prospectId] = [];
    acc[f.prospectId].push(f);
    return acc;
  }, {});

  // Sort by sentAt descending
  const sorted = [...sentStep1s].sort(
    (a, b) => (b.sentAt?.getTime() ?? 0) - (a.sentAt?.getTime() ?? 0)
  );

  const hasAnyReply = followUps.some((f) => f.status === "skipped");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Outreach</h1>
          <p className="text-slate-500 text-sm mt-1">Track your sent sequences and reply activity</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span><strong className="text-slate-900">{sentStep1s.length}</strong> sent</span>
          {hasAnyReply && (
            <span>
              <strong className="text-emerald-600">
                {new Set(followUps.filter((f) => f.status === "skipped").map((f) => f.prospectId)).size}
              </strong> replied
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Prospect</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Email 1</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Follow-up 2</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Follow-up 3</th>
              <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((step1, i) => {
              const p = prospectMap[step1.prospectId];
              if (!p) return null;
              const fups = (followUpsByProspect[step1.prospectId] ?? []).sort(
                (a, b) => a.sendAt.getTime() - b.sendAt.getTime()
              );
              const fup2 = fups[0];
              const fup3 = fups[1];
              const hasReply = fups.some((f) => f.status === "skipped");

              return (
                <tr
                  key={step1.id}
                  className={`${i < sorted.length - 1 ? "border-b border-slate-100" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                        {p.firstName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-slate-400">{p.company}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Sent {formatDate(step1.sentAt)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {fup2 ? (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STEP_STATUS_COLOR[fup2.status]}`}>
                        {fup2.status === "pending" && <Clock className="w-3 h-3" />}
                        {fup2.status === "skipped" && <SkipForward className="w-3 h-3" />}
                        {STEP_STATUS_LABEL[fup2.status]}
                        {fup2.status === "pending" && <span className="text-amber-500/70"> · {formatDate(fup2.sendAt)}</span>}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {fup3 ? (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STEP_STATUS_COLOR[fup3.status]}`}>
                        {fup3.status === "pending" && <Clock className="w-3 h-3" />}
                        {fup3.status === "skipped" && <SkipForward className="w-3 h-3" />}
                        {STEP_STATUS_LABEL[fup3.status]}
                        {fup3.status === "pending" && <span className="text-amber-500/70"> · {formatDate(fup3.sendAt)}</span>}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {hasReply && (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Replied
                      </span>
                    )}
                    <Link
                      href={`/sequences/${p.id}`}
                      className="ml-2 text-xs text-slate-400 hover:text-indigo-600"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
