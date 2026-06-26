import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { prospects, emailSequences } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ChevronRight, Mail } from "lucide-react";
import Link from "next/link";

export default async function SequencesPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const rows = await db
    .select({
      id: prospects.id,
      firstName: prospects.firstName,
      lastName: prospects.lastName,
      company: prospects.company,
      pushStatus: emailSequences.pushStatus,
    })
    .from(prospects)
    .leftJoin(
      emailSequences,
      and(
        eq(emailSequences.prospectId, prospects.id),
        eq(emailSequences.stepNumber, 1)
      )
    )
    .where(
      and(
        eq(prospects.userId, userId),
        eq(prospects.generateStatus, "generated")
      )
    )
    .orderBy(desc(prospects.createdAt));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sequences</h1>
        <p className="text-slate-500 text-sm mt-1">
          {rows.length} sequence{rows.length !== 1 ? "s" : ""} generated
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-400 shadow-sm">
          No sequences yet —{" "}
          <Link href="/prospects" className="text-indigo-600 hover:underline">
            upload prospects
          </Link>{" "}
          to get started.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {rows.map((p, i) => {
            const isPushed = p.pushStatus === "pushed";
            return (
              <Link
                key={p.id}
                href={`/sequences/${p.id}`}
                className={`flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors ${
                  i < rows.length - 1 ? "border-b border-slate-100" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                    {p.firstName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{p.company}</p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-4 text-xs text-slate-400">
                    <Mail className="w-3.5 h-3.5" /> 3 emails
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isPushed
                        ? "bg-indigo-50 text-indigo-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {isPushed ? "Sent" : "Ready"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
