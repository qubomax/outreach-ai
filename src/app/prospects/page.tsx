"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  ExternalLink,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Circle,
  Send,
  Zap,
} from "lucide-react";
import Link from "next/link";

type ScrapeStatus = "pending" | "scraping" | "scraped" | "failed";
type GenerateStatus = "pending" | "generating" | "generated" | "failed";

interface Prospect {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  websiteUrl: string | null;
  scrapeStatus: ScrapeStatus;
  generateStatus: GenerateStatus;
  createdAt: string;
}

function getDisplayStatus(p: Prospect): string {
  if (p.generateStatus === "generated") return "ready";
  if (p.generateStatus === "generating") return "generating";
  if (p.generateStatus === "failed") return "failed";
  if (p.scrapeStatus === "scraping") return "scraping";
  if (p.scrapeStatus === "failed") return "failed";
  if (p.scrapeStatus === "scraped") return "scraped";
  return "pending";
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: {
    label: "Pending",
    icon: <Circle className="w-3.5 h-3.5" />,
    color: "text-slate-400",
  },
  scraping: {
    label: "Scraping website...",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    color: "text-amber-500",
  },
  scraped: {
    label: "Scraped — ready to generate",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: "text-slate-500",
  },
  generating: {
    label: "Generating sequence...",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    color: "text-blue-500",
  },
  ready: {
    label: "Ready to push",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: "text-emerald-600",
  },
  pushed: {
    label: "Pushed to Instantly",
    icon: <Send className="w-3.5 h-3.5" />,
    color: "text-indigo-600",
  },
  failed: {
    label: "Failed",
    icon: <Circle className="w-3.5 h-3.5" />,
    color: "text-red-500",
  },
};

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProspects = useCallback(async () => {
    const res = await fetch("/api/prospects");
    if (res.ok) setProspects(await res.json());
  }, []);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  // Single stable interval — scrape queue → generation pipeline
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/prospects");
      if (!res.ok) return;
      const all: Prospect[] = await res.json();

      const scraping = all.filter((p) => p.scrapeStatus === "scraping");

      // Poll Apify for in-progress scrapes
      if (scraping.length > 0) {
        await Promise.all(scraping.map((p) => fetch(`/api/scrape/${p.id}`)));
      }

      // Refresh after Apify updates
      const freshRes = await fetch("/api/prospects");
      if (!freshRes.ok) return;
      const fresh: Prospect[] = await freshRes.json();
      setProspects(fresh);

      const isAnyScraping = fresh.some((p) => p.scrapeStatus === "scraping");
      const isAnyGenerating = fresh.some((p) => p.generateStatus === "generating");
      const pendingIds = fresh
        .filter((p) => p.scrapeStatus === "pending" && p.websiteUrl)
        .map((p) => p.id);
      const needsGeneration = fresh.some(
        (p) => p.scrapeStatus === "scraped" && p.generateStatus === "pending"
      );

      if (!isAnyScraping && pendingIds.length > 0) {
        // Kick off next scrape in the queue
        await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prospectIds: pendingIds }),
        });
        const nextRes = await fetch("/api/prospects");
        if (nextRes.ok) setProspects(await nextRes.json());
      } else if (!isAnyScraping && !isAnyGenerating && needsGeneration) {
        // All scraping done — trigger Claude generation for scraped prospects
        await fetch("/api/generate", { method: "POST" });
        const genRes = await fetch("/api/prospects");
        if (genRes.ok) setProspects(await genRes.json());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []); // Stable — no stale closure issues

  const startScraping = async (ids: number[]) => {
    await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospectIds: ids }),
    });
    await loadProspects();
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/prospects/upload", { method: "POST", body: form });
    const json = await res.json();
    setUploading(false);
    if (!res.ok) {
      setUploadError(json.error ?? "Upload failed");
      return;
    }
    const listRes = await fetch("/api/prospects");
    if (listRes.ok) {
      const all: Prospect[] = await listRes.json();
      setProspects(all);
      const pendingIds = all
        .filter((p) => p.scrapeStatus === "pending" && p.websiteUrl)
        .map((p) => p.id);
      if (pendingIds.length > 0) startScraping(pendingIds);
    }
  };

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const toggleAll = () =>
    setSelected(selected.length === prospects.length ? [] : prospects.map((p) => p.id));

  const pendingSelected = selected.filter((id) => {
    const p = prospects.find((x) => x.id === id);
    return p?.scrapeStatus === "pending" && p?.websiteUrl;
  });

  const readyCount = prospects.filter((p) => getDisplayStatus(p) === "ready").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prospects</h1>
          <p className="text-slate-500 text-sm mt-1">
            {prospects.length} prospects · {readyCount} sequences ready
          </p>
        </div>
        <div className="flex gap-2">
          {pendingSelected.length > 0 && (
            <Button
              variant="outline"
              className="border-amber-300 text-amber-600 hover:bg-amber-50 gap-2"
              onClick={() => startScraping(pendingSelected)}
            >
              <Zap className="w-4 h-4" />
              Scrape {pendingSelected.length} selected
            </Button>
          )}
          {selected.length > 0 && (
            <Button
              variant="outline"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 gap-2"
            >
              <Send className="w-4 h-4" />
              Push {selected.length} to Instantly
            </Button>
          )}
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Uploading..." : "Upload CSV"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* CSV drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) uploadFile(f);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-indigo-400 bg-indigo-50"
            : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
        }`}
      >
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-700 font-medium">
          Drop your CSV here or{" "}
          <span className="text-indigo-600">browse files</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Required columns: name, email, company, website_url
        </p>
        {uploadError && (
          <p className="text-xs text-red-500 mt-2">{uploadError}</p>
        )}
      </div>

      {/* Prospect table */}
      {prospects.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-[32px_1fr_1fr_160px_120px_48px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selected.length === prospects.length && prospects.length > 0}
                onChange={toggleAll}
                className="rounded border-slate-300 accent-indigo-600"
              />
            </div>
            <div>Prospect</div>
            <div>Company</div>
            <div>Status</div>
            <div>Added</div>
            <div />
          </div>

          {prospects.map((p) => {
            const status = getDisplayStatus(p);
            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
            return (
              <div
                key={p.id}
                className="grid grid-cols-[32px_1fr_1fr_160px_120px_48px] gap-4 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 items-center transition-colors"
              >
                <div>
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggle(p.id)}
                    className="rounded border-slate-300 accent-indigo-600"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-slate-400">{p.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-700">{p.company}</p>
                  {p.websiteUrl && (
                    <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                    </a>
                  )}
                </div>

                <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                  {cfg.icon}
                  {cfg.label}
                </div>

                <div className="text-xs text-slate-400">
                  {new Date(p.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>

                <div>
                  {status === "ready" && (
                    <Link href={`/sequences/${p.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 text-slate-400 hover:text-slate-700"
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
      )}
    </div>
  );
}
