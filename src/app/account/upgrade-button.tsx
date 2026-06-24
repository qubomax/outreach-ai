"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function UpgradeButton({
  plan,
  highlight,
}: {
  plan: "starter" | "growth" | "agency";
  highlight: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  };

  return (
    <Button
      onClick={handleUpgrade}
      disabled={loading}
      className={`w-full text-sm font-medium gap-2 ${
        highlight
          ? "bg-white text-indigo-600 hover:bg-indigo-50"
          : "bg-indigo-600 text-white hover:bg-indigo-700"
      }`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading ? "Redirecting..." : "Upgrade"}
    </Button>
  );
}
