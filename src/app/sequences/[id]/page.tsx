"use client";

import { use, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Send,
  Pencil,
  Check,
  X,
  ExternalLink,
  Calendar,
  Loader2,
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
        if (data.steps[0]?.pushStatus === 'pushed') setPushed(true);
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

  const pushToInstantly = async () => {
    setPushing(true);
    setPushError(null);
    const res = await fetch('/api/instantly/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospectId: parseInt(id) }),
    });
    if (res.ok) {
      setPushed(true);
    } else {
      const json = await res.json();
      setPushError(json.error ?? 'Push failed — check your Instantly API key.');
    }
    setPushing(false);
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/prospects"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-3"
          >
            <ArrowLeft className="w-3 h-3" /> All prospects
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {prospect.firstName} {prospect.lastName}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 text-sm">{prospect.company}</p>
            {prospect.websiteUrl && (
              <a
                href={prospect.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
              >
                {prospect.websiteUrl} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
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
          {pushError && (
            <p className="text-xs text-red-500">{pushError}</p>
          )}
        </div>
      </div>

      {/* Prospect brief */}
      {prospect.prospectBrief && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Prospect Brief
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 leading-relaxed">
              {prospect.prospectBrief}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Email steps */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">3-Step Email Sequence</h2>

        {steps.map((step, i) => {
          const isEditing = editingId === step.id;

          return (
            <Card key={step.id} className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                      {step.stepNumber}
                    </span>
                    <CardTitle className="text-sm font-medium text-slate-700">
                      {STEP_LABELS[i] ?? `Email ${step.stepNumber}`}
                    </CardTitle>
                    {step.delayDays > 0 && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        Send after {step.delayDays} days
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
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
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
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Subject */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block uppercase tracking-wide">
                    Subject
                  </label>
                  {isEditing && draft ? (
                    <input
                      value={draft.subject}
                      onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900">{step.subject}</p>
                  )}
                </div>

                {/* Body */}
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block uppercase tracking-wide">
                    Body
                  </label>
                  {isEditing && draft ? (
                    <Textarea
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                      rows={10}
                      className="bg-white border-slate-300 text-sm text-slate-900 focus:ring-indigo-500 resize-none"
                    />
                  ) : (
                    <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                      {step.body}
                    </pre>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
