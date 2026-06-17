"use client";

import { useState } from "react";
import { DUMMY_PROSPECTS, Prospect } from "@/lib/dummy-data";
import { Button } from "@/components/ui/button";
import {
  Upload,
  ExternalLink,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Clock,
  Circle,
  Send,
} from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pending: {
    label: "Pending",
    icon: <Circle className="w-3.5 h-3.5" />,
    color: "text-zinc-400",
  },
  scraping: {
    label: "Scraping website...",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    color: "text-yellow-400",
  },
  generating: {
    label: "Generating sequence...",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    color: "text-blue-400",
  },
  ready: {
    label: "Ready to push",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: "text-emerald-400",
  },
  pushed: {
    label: "Pushed to Instantly",
    icon: <Send className="w-3.5 h-3.5" />,
    color: "text-indigo-400",
  },
};

export default function ProspectsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  const toggleAll = () =>
    setSelected(
      selected.length === DUMMY_PROSPECTS.length
        ? []
        : DUMMY_PROSPECTS.map((p) => p.id)
    );

  const readyCount = DUMMY_PROSPECTS.filter((p) => p.status === "ready").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Prospects</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {DUMMY_PROSPECTS.length} prospects · {readyCount} sequences ready
          </p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <Button
              variant="outline"
              className="border-indigo-600 text-indigo-400 hover:bg-indigo-900/30 gap-2"
            >
              <Send className="w-4 h-4" />
              Push {selected.length} to Instantly
            </Button>
          )}
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
            <Upload className="w-4 h-4" /> Upload CSV
          </Button>
        </div>
      </div>

      {/* CSV drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver
            ? "border-indigo-500 bg-indigo-900/20"
            : "border-zinc-700 bg-zinc-900/30"
        }`}
      >
        <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
        <p className="text-sm text-zinc-300 font-medium">
          Drop your CSV here or{" "}
          <span className="text-indigo-400 cursor-pointer">browse files</span>
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Required columns: name, email, company, website_url
        </p>
      </div>

      {/* Prospect table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[32px_1fr_1fr_160px_120px_48px] gap-4 px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wide">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selected.length === DUMMY_PROSPECTS.length}
              onChange={toggleAll}
              className="rounded border-zinc-600 bg-zinc-800 accent-indigo-500"
            />
          </div>
          <div>Prospect</div>
          <div>Company</div>
          <div>Status</div>
          <div>Added</div>
          <div />
        </div>

        {/* Rows */}
        {DUMMY_PROSPECTS.map((p) => {
          const cfg = STATUS_CONFIG[p.status];
          return (
            <div
              key={p.id}
              className="grid grid-cols-[32px_1fr_1fr_160px_120px_48px] gap-4 px-4 py-3 border-b border-zinc-800 last:border-0 hover:bg-zinc-900/60 items-center"
            >
              <div>
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggle(p.id)}
                  className="rounded border-zinc-600 bg-zinc-800 accent-indigo-500"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-white">{p.name}</p>
                <p className="text-xs text-zinc-500">{p.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm text-zinc-300">{p.company}</p>
                <a
                  href={p.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3 text-zinc-600 hover:text-zinc-400" />
                </a>
              </div>

              <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                {cfg.icon}
                {cfg.label}
              </div>

              <div className="text-xs text-zinc-500">
                {new Date(p.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>

              <div>
                {p.status === "ready" && (
                  <Link href={`/sequences/${p.id}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-zinc-500 hover:text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
