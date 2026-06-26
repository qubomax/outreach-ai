"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Mail } from "lucide-react";

async function patchSetting(key: string, value: string) {
  await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [key]: value }),
  });
}

function useSaveField(key: string) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async (value: string) => {
    setSaving(true);
    await patchSetting(key, value);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return { saving, saved, save };
}

export default function SettingsPage() {
  const [senderName, setSenderName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [valueProp, setValueProp] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSenderName(data.senderName ?? '');
        setCompanyName(data.companyName ?? '');
        setValueProp(data.valueProposition ?? '');
        setGmailEmail(data.gmailEmail ?? null);
      });
  }, []);

  const saveProfile = async () => {
    setProfileSaving(true);
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderName, companyName, valueProposition: valueProp }),
    });
    setProfileSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your inbox and sender profile</p>
      </div>

      {/* Gmail connection */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Connected Inbox</CardTitle>
          <p className="text-xs text-slate-500">
            Cold Hero sends emails from your Gmail account on your behalf.
          </p>
        </CardHeader>
        <CardContent>
          {gmailEmail ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{gmailEmail}</p>
                  <p className="text-xs text-emerald-600">Connected</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-300 text-slate-600"
                onClick={() => window.location.href = '/api/gmail/connect'}
              >
                Reconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">No inbox connected yet.</p>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm gap-2"
                onClick={() => window.location.href = '/api/gmail/connect'}
              >
                <Mail className="w-4 h-4" /> Connect Gmail
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sender profile */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Sender Profile</CardTitle>
          <p className="text-xs text-slate-500">
            Used to personalize the email sequences Claude generates.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Your Name</label>
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Alex"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Your Company</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Value Proposition</label>
            <textarea
              rows={3}
              value={valueProp}
              onChange={(e) => setValueProp(e.target.value)}
              placeholder="We help B2B sales teams send hyper-personalized cold emails at scale..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-400">
              This is injected into every email sequence Claude generates.
            </p>
          </div>
          <Button
            onClick={saveProfile}
            disabled={profileSaving || profileSaved}
            className={`gap-1.5 ${
              profileSaved
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-50"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            }`}
          >
            {profileSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : profileSaved ? (
              <><Check className="w-4 h-4" /> Saved</>
            ) : (
              "Save Profile"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
