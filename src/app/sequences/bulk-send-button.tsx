"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BulkSendButton({ prospectIds }: { prospectIds: number[] }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: prospectIds.length });

  async function handleSendAll() {
    if (!confirm(`Send sequences to all ${prospectIds.length} unsent prospect${prospectIds.length !== 1 ? "s" : ""}?`)) return;

    setState("sending");
    let sent = 0;
    let failed = 0;

    for (const id of prospectIds) {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: id }),
      });
      if (res.ok) {
        sent++;
      } else {
        failed++;
      }
      setProgress({ sent, failed, total: prospectIds.length });
    }

    setState("done");
    router.refresh();
  }

  if (state === "idle") {
    return (
      <Button
        onClick={handleSendAll}
        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm text-sm"
      >
        <Send className="w-4 h-4" />
        Send All ({prospectIds.length})
      </Button>
    );
  }

  if (state === "sending") {
    return (
      <div className="flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
        <span className="text-sm text-slate-600">
          Sending {progress.sent + progress.failed} / {progress.total}…
        </span>
      </div>
    );
  }

  return (
    <span className="text-sm text-slate-500">
      Done — {progress.sent} sent{progress.failed > 0 ? `, ${progress.failed} failed` : ""}
    </span>
  );
}
