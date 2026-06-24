"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function SyncPlanButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/sync", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (data.synced) {
      setDone(true);
      setTimeout(() => window.location.reload(), 800);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSync}
      disabled={loading}
      className="text-xs text-slate-400 hover:text-slate-600 gap-1.5"
    >
      <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
      {done ? "Synced!" : loading ? "Syncing..." : "Sync plan"}
    </Button>
  );
}
