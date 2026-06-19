import { DUMMY_PROSPECTS } from "@/lib/dummy-data";
import { Button } from "@/components/ui/button";
import { ChevronRight, Mail } from "lucide-react";
import Link from "next/link";

export default function SequencesPage() {
  const withSequences = DUMMY_PROSPECTS.filter(
    (p) => p.status === "ready" || p.status === "pushed"
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sequences</h1>
        <p className="text-slate-500 text-sm mt-1">
          {withSequences.length} sequences generated
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {withSequences.map((p, i) => (
          <Link
            key={p.id}
            href={`/sequences/${p.id}`}
            className={`flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors ${
              i < withSequences.length - 1 ? "border-b border-slate-100" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                {p.name[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{p.name}</p>
                <p className="text-xs text-slate-400">{p.company}</p>
              </div>
              <div className="flex items-center gap-1.5 ml-4 text-xs text-slate-400">
                <Mail className="w-3.5 h-3.5" />3 emails
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  p.status === "pushed"
                    ? "bg-indigo-50 text-indigo-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {p.status === "pushed" ? "Pushed to Instantly" : "Ready to push"}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
