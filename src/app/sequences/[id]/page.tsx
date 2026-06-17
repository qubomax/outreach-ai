"use client";

import { use, useState } from "react";
import { DUMMY_PROSPECTS } from "@/lib/dummy-data";
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
} from "lucide-react";
import Link from "next/link";

interface EmailStep {
  step: number;
  subject: string;
  body: string;
  delayDays: number;
}

export default function SequencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const prospect = DUMMY_PROSPECTS.find((p) => p.id === id);

  const [sequence, setSequence] = useState<EmailStep[]>(
    prospect?.sequence ?? []
  );
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [draft, setDraft] = useState<EmailStep | null>(null);
  const [pushed, setPushed] = useState(false);

  if (!prospect) {
    return (
      <div className="max-w-3xl mx-auto pt-16 text-center text-zinc-500">
        Prospect not found.{" "}
        <Link href="/prospects" className="text-indigo-400">
          Go back
        </Link>
      </div>
    );
  }

  const startEdit = (step: EmailStep) => {
    setEditingStep(step.step);
    setDraft({ ...step });
  };

  const saveEdit = () => {
    if (!draft) return;
    setSequence((s) => s.map((step) => (step.step === draft.step ? draft : step)));
    setEditingStep(null);
    setDraft(null);
  };

  const cancelEdit = () => {
    setEditingStep(null);
    setDraft(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/prospects"
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-3"
          >
            <ArrowLeft className="w-3 h-3" /> All prospects
          </Link>
          <h1 className="text-2xl font-bold text-white">{prospect.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-zinc-400 text-sm">{prospect.company}</p>
            <a
              href={prospect.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
            >
              {prospect.websiteUrl} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <Button
          onClick={() => setPushed(true)}
          disabled={pushed}
          className={`gap-2 ${
            pushed
              ? "bg-emerald-800 text-emerald-300 cursor-default"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          <Send className="w-4 h-4" />
          {pushed ? "Pushed to Instantly" : "Push to Instantly"}
        </Button>
      </div>

      {/* Prospect brief */}
      {prospect.brief && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Prospect Brief
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {prospect.brief}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Email sequence */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">
          3-Step Email Sequence
        </h2>

        {sequence.map((step) => {
          const isEditing = editingStep === step.step;

          return (
            <Card key={step.step} className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-900 text-indigo-300 text-xs font-bold flex items-center justify-center">
                      {step.step}
                    </span>
                    <CardTitle className="text-sm font-medium text-zinc-300">
                      {step.step === 1
                        ? "Initial Email"
                        : step.step === 2
                        ? "First Follow-up"
                        : "Final Follow-up"}
                    </CardTitle>
                    {step.delayDays > 0 && (
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
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
                      className="h-7 px-2 text-zinc-500 hover:text-white gap-1"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={saveEdit}
                        className="h-7 px-2 text-emerald-400 hover:text-emerald-300 gap-1"
                      >
                        <Check className="w-3 h-3" /> Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                        className="h-7 px-2 text-zinc-500 hover:text-white"
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
                  <label className="text-xs text-zinc-500 mb-1 block">
                    Subject
                  </label>
                  {isEditing && draft ? (
                    <input
                      value={draft.subject}
                      onChange={(e) =>
                        setDraft({ ...draft, subject: e.target.value })
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-sm font-medium text-white">
                      {step.subject}
                    </p>
                  )}
                </div>

                {/* Body */}
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">
                    Body
                  </label>
                  {isEditing && draft ? (
                    <Textarea
                      value={draft.body}
                      onChange={(e) =>
                        setDraft({ ...draft, body: e.target.value })
                      }
                      rows={10}
                      className="bg-zinc-800 border-zinc-700 text-sm text-white focus:ring-indigo-500 resize-none"
                    />
                  ) : (
                    <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
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
