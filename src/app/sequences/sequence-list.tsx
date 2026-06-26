"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Mail, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Row = {
  id: number;
  firstName: string;
  lastName: string;
  company: string;
  pushStatus: string | null;
};

export default function SequenceList({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const unsentIds = rows.filter((r) => r.pushStatus !== "pushed").map((r) => r.id);

  const [selected, setSelected] = useState<Set<number>>(new Set(unsentIds));
  const [sendState, setSendState] = useState<"idle" | "sending" | "done">("idle");
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 });

  const allUnsentSelected = unsentIds.every((id) => selected.has(id));
  const someUnsentSelected = unsentIds.some((id) => selected.has(id));

  function toggleAll() {
    if (allUnsentSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        unsentIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...unsentIds]));
    }
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSend() {
    const toSend = unsentIds.filter((id) => selected.has(id));
    if (toSend.length === 0) return;
    if (!confirm(`Send sequences to ${toSend.length} prospect${toSend.length !== 1 ? "s" : ""}?`)) return;

    setSendState("sending");
    setProgress({ sent: 0, failed: 0, total: toSend.length });
    let sent = 0;
    let failed = 0;

    for (const id of toSend) {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: id }),
      });
      if (res.ok) sent++; else failed++;
      setProgress({ sent, failed, total: toSend.length });
    }

    setSendState("done");
    router.refresh();
  }

  const selectedUnsentCount = unsentIds.filter((id) => selected.has(id)).length;

  return (
    <>
      {/* Header row with send button */}
      {unsentIds.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {selectedUnsentCount} of {unsentIds.length} unsent selected
          </span>
          {sendState === "idle" && (
            <Button
              onClick={handleSend}
              disabled={selectedUnsentCount === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm text-sm disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              Send Selected ({selectedUnsentCount})
            </Button>
          )}
          {sendState === "sending" && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              Sending {progress.sent + progress.failed} / {progress.total}…
            </div>
          )}
          {sendState === "done" && (
            <span className="text-sm text-slate-500">
              Done — {progress.sent} sent{progress.failed > 0 ? `, ${progress.failed} failed` : ""}
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {/* Select-all header */}
        {unsentIds.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <input
              type="checkbox"
              checked={allUnsentSelected}
              ref={(el) => { if (el) el.indeterminate = someUnsentSelected && !allUnsentSelected; }}
              onChange={toggleAll}
              className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
            />
            <span className="text-xs text-slate-500 font-medium">Select all unsent</span>
          </div>
        )}

        {rows.map((p, i) => {
          const isPushed = p.pushStatus === "pushed";
          const isSelected = selected.has(p.id);

          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-4 py-4 ${
                i < rows.length - 1 ? "border-b border-slate-100" : ""
              } ${!isPushed && isSelected ? "bg-indigo-50/40" : ""}`}
            >
              {/* Checkbox — only for unsent */}
              <div className="w-5 shrink-0">
                {!isPushed && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(p.id)}
                    className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                  />
                )}
              </div>

              {/* Avatar + name */}
              <Link
                href={`/sequences/${p.id}`}
                className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
                  {p.firstName[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-slate-400">{p.company}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-4 text-xs text-slate-400">
                  <Mail className="w-3.5 h-3.5" /> 3 emails
                </div>
              </Link>

              {/* Status + arrow */}
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isPushed
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {isPushed ? "Sent" : "Ready"}
                </span>
                <Link href={`/sequences/${p.id}`}>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
