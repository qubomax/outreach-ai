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
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

type ScrapeStatus = "pending" | "scraping" | "scraped" | "failed";
type GenerateStatus = "pending" | "generating" | "generated" | "failed";
type PushStatus = "pending" | "pushed" | "failed" | null;

interface Prospect {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  websiteUrl: string | null;
  scrapeStatus: ScrapeStatus;
  generateStatus: GenerateStatus;
  pushStatus: PushStatus;
  createdAt: string;
  updatedAt: string;
}

function getDisplayStatus(p: Prospect): string {
  if (p.pushStatus === "pushed") return "pushed";
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
    label: "Ready to send",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: "text-emerald-600",
  },
  pushed: {
    label: "Sent",
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
  const [retryingIds, setRetryingIds] = useState<Set<number>>(new Set());
  const [sendState, setSendState] = useState<"idle" | "confirming" | "sending" | "done">("idle");
  const [sendProgress, setSendProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProspects = useCallback(async () => {
    const res = await fetch("/api/prospects");
    if (res.ok) setProspects(await res.json());
  }, []);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  // Poll every 2s — refresh list and kick off scrape for pending prospects
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/prospects");
      if (!res.ok) return;
      const fresh: Prospect[] = await res.json();
      setProspects(fresh);

      const now = Date.now();
      const STUCK_MS = 2 * 60 * 1000;
      // Actively scraping = updated within last 2 minutes
      const isActivelyScrapingSome = fresh.some(
        (p) => p.scrapeStatus === "scraping" && now - new Date(p.updatedAt).getTime() < STUCK_MS
      );
      const isAnyGenerating = fresh.some((p) => p.generateStatus === "generating");
      const pendingIds = fresh
        .filter((p) => p.scrapeStatus === "pending" && p.websiteUrl)
        .map((p) => p.id);
      // Stuck = marked scraping but not updated in > 2 minutes (function timed out)
      const stuckIds = fresh
        .filter(
          (p) => p.scrapeStatus === "scraping" && now - new Date(p.updatedAt).getTime() >= STUCK_MS
        )
        .map((p) => p.id);
      const needsGeneration = fresh.some(
        (p) => p.scrapeStatus === "scraped" && p.generateStatus === "pending"
      );

      // Scraping and generation run independently — don't wait for each other
      const idsToScrape = [...pendingIds, ...stuckIds];
      if (!isActivelyScrapingSome && idsToScrape.length > 0) {
        await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prospectIds: idsToScrape }),
        });
      }
      if (!isAnyGenerating && needsGeneration) {
        await fetch("/api/generate", { method: "POST" });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const retryScrape = async (id: number) => {
    setRetryingIds((s) => new Set(s).add(id));
    await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospectIds: [id], force: true }),
    });
    await loadProspects();
    setRetryingIds((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  const retryAllFailed = async () => {
    const failedIds = prospects
      .filter((p) => getDisplayStatus(p) === "failed")
      .map((p) => p.id);
    if (failedIds.length === 0) return;
    await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospectIds: failedIds, force: true }),
    });
    await loadProspects();
  };

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

  const statusCounts = {
    pending:    prospects.filter((p) => getDisplayStatus(p) === "pending").length,
    scraping:   prospects.filter((p) => getDisplayStatus(p) === "scraping").length,
    scraped:    prospects.filter((p) => getDisplayStatus(p) === "scraped").length,
    generating: prospects.filter((p) => getDisplayStatus(p) === "generating").length,
    ready:      prospects.filter((p) => getDisplayStatus(p) === "ready").length,
    sent:       prospects.filter((p) => getDisplayStatus(p) === "pushed").length,
    failed:     prospects.filter((p) => getDisplayStatus(p) === "failed").length,
  };
  const readyCount = statusCounts.ready;
  const failedCount = statusCounts.failed;
  const selectedReadyIds = selected.filter(
    (id) => getDisplayStatus(prospects.find((p) => p.id === id)!) === "ready"
  );

  const handleSendSelected = async () => {
    if (selectedReadyIds.length === 0) return;
    setSendState("sending");
    setSendProgress({ sent: 0, failed: 0, total: selectedReadyIds.length });
    let sent = 0;
    let failed = 0;
    for (const id of selectedReadyIds) {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: id }),
      });
      if (res.ok) sent++; else failed++;
      setSendProgress({ sent, failed, total: selectedReadyIds.length });
    }
    setSendState("done");
    setSelected([]);
    await loadProspects();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prospects</h1>
          <p className="text-slate-500 text-sm mt-1">{prospects.length} total</p>
          {prospects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {statusCounts.pending > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  {statusCounts.pending} pending
                </span>
              )}
              {statusCounts.scraping > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  {statusCounts.scraping} scraping
                </span>
              )}
              {statusCounts.scraped > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {statusCounts.scraped} scraped
                </span>
              )}
              {statusCounts.generating > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {statusCounts.generating} generating
                </span>
              )}
              {statusCounts.ready > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  {statusCounts.ready} ready to send
                </span>
              )}
              {statusCounts.sent > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {statusCounts.sent} sent
                </span>
              )}
              {statusCounts.failed > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                  {statusCounts.failed} failed
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Action bar — appears when ready rows are checked */}
          {selected.length > 0 && selectedReadyIds.length > 0 && sendState === "idle" && (
            <Button
              onClick={() => setSendState("confirming")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              Send Selected ({selectedReadyIds.length})
            </Button>
          )}
          {sendState === "confirming" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Send to {selectedReadyIds.length} prospect{selectedReadyIds.length !== 1 ? "s" : ""}?</span>
              <Button
                onClick={handleSendSelected}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm h-9 px-3"
              >
                Confirm
              </Button>
              <Button
                onClick={() => setSendState("idle")}
                variant="outline"
                className="h-9 px-3"
              >
                Cancel
              </Button>
            </div>
          )}
          {sendState === "sending" && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              Sending {sendProgress.sent + sendProgress.failed} / {sendProgress.total}…
            </div>
          )}
          {sendState === "done" && (
            <span className="text-sm text-slate-500">
              Done — {sendProgress.sent} sent{sendProgress.failed > 0 ? `, ${sendProgress.failed} failed` : ""}
            </span>
          )}
          {failedCount > 0 && sendState === "idle" && (
            <Button
              onClick={retryAllFailed}
              variant="outline"
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4" />
              Retry All Failed ({failedCount})
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
          <div className="grid grid-cols-[32px_1fr_1fr_160px_120px_72px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wide">
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
                className="grid grid-cols-[32px_1fr_1fr_160px_120px_72px] gap-4 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 items-center transition-colors"
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

                <div className="flex items-center gap-1">
                  {status === "failed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                      onClick={() => retryScrape(p.id)}
                      disabled={retryingIds.has(p.id)}
                      title="Retry scrape"
                    >
                      {retryingIds.has(p.id) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  )}
                  {(status === "ready" || status === "pushed") && (
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
