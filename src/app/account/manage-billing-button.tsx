"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  const handlePortal = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  };

  return (
    <Button
      variant="outline"
      onClick={handlePortal}
      disabled={loading}
      className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 text-sm"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading ? "Loading..." : "Manage billing"}
    </Button>
  );
}
