import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { prospects, emailSequences } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import SequenceList from "./sequence-list";

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
        <SequenceList rows={rows} />
      )}
    </div>
  );
}
