"use client";

import { use, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Send,
  Pencil,
  Check,
  X,
  ExternalLink,
  Calendar,
  Loader2,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface EmailStep {
  id: number;
  stepNumber: number;
  subject: string;
  body: string;
  delayDays: number;
  pushStatus: string | null;
}

interface Prospect {
  id: number;
  firstName: string;
  lastName: string;
  company: string;
  websiteUrl: string | null;
  prospectBrief: string | null;
}

const STEP_LABELS = ["Initial Email", "First Follow-up", "Final Follow-up"];

export default function SequencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [steps, setSteps] = useState<EmailStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EmailStep | null>(null);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushed, setPushed] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sequences/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setProspect(data.prospect);
        setSteps(data.steps);
        if (data.steps[0]?.pushStatus === "pushed") setPushed(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const startEdit = (step: EmailStep) => {
    setEditingId(step.id);
    setDraft({ ...step });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!draft) return;
    setSaving(true);
    await fetch(`/api/sequences/steps/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: draft.subject, body: draft.body }),
    });
    setSteps((s) => s.map((step) => (step.id === draft.id ? draft : step)));
    setEditingId(null);
    setDraft(null);
    setSaving(false);
  };

  const pushToInstantly = async () => {
    setPushing(true);
    setPushError(null);
    const res = await fetch("/api/instantly/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospectId: parseInt(id) }),
    });
    if (res.ok) {
      setPushed(true);
    } else {
      const json = await res.json();
      setPushError(json.error ?? "Push failed — check your Instantly API key.");
    }
    setPushing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading sequence...
      </div>
    );
  }

  if (notFound || !prospect) {
    return (
      <div className="max-w-3xl mx-auto pt-16 text-center text-slate-400">
        Prospect not found.{" "}
        <Link href="/prospects" className="text-indigo-600 hover:underline">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
        <div>
          <Link
            href="/prospects"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-1"
          >
            <ArrowLeft className="w-3 h-3" /> All prospects
          </Link>
          <h1 className="text-xl font-bold text-slate-900">
            {prospect.firstName} {prospect.lastName}
            <span className="ml-2 text-slate-400 font-normal text-base">
              · {prospect.company}
            </span>
          </h1>
          {prospect.websiteUrl && (
            <a
              href={prospect.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-0.5"
            >
              {prospect.websiteUrl} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <Button
            onClick={pushToInstantly}
            disabled={pushing || pushed}
            className={`gap-2 shadow-sm ${
              pushed
                ? "bg-emerald-600 hover:bg-emerald-600 text-white cursor-default"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {pushing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {pushed ? "Pushed to Instantly" : pushing ? "Pushing..." : "Push to Instantly"}
          </Button>
          {pushError && <p className="text-xs text-red-500 max-w-xs text-right">{pushError}</p>}
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-6 items-start">
        {/* Left panel — prospect brief (sticky) */}
        <div className="w-72 shrink-0 sticky top-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Prospect Brief
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            {prospect.prospectBrief ? (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {prospect.prospectBrief}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">
                No brief generated yet.
              </p>
            )}
          </div>
        </div>

        {/* Right panel — email steps */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              3-Step Email Sequence
            </span>
          </div>

          {steps.map((step, i) => {
            const isEditing = editingId === step.id;

            return (
              <div
                key={step.id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Step header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {step.stepNumber}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {STEP_LABELS[i] ?? `Email ${step.stepNumber}`}
                    </span>
                    {step.delayDays > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-400 ml-1">
                        <Calendar className="w-3 h-3" />
                        +{step.delayDays} days
                      </span>
                    )}
                  </div>

                  {!isEditing ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(step)}
                      className="h-7 px-2 text-slate-400 hover:text-slate-700 gap-1"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={saveEdit}
                        disabled={saving}
                        className="h-7 px-2 text-emerald-600 hover:text-emerald-700 gap-1"
                      >
                        {saving ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                        className="h-7 px-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Step body */}
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wide">
                      Subject
                    </label>
                    {isEditing && draft ? (
                      <input
                        value={draft.subject}
                        onChange={(e) =>
                          setDraft({ ...draft, subject: e.target.value })
                        }
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-900">
                        {step.subject}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wide">
                      Body
                    </label>
                    {isEditing && draft ? (
                      <Textarea
                        value={draft.body}
                        onChange={(e) =>
                          setDraft({ ...draft, body: e.target.value })
                        }
                        rows={10}
                        className="bg-white border-slate-300 text-sm text-slate-900 focus:ring-indigo-500 resize-none"
                      />
                    ) : (
                      <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                        {step.body}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
