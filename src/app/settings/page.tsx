"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Check, Loader2 } from "lucide-react";

function ApiKeyInput({
  label,
  placeholder,
  value,
  onChange,
  onSave,
  saving,
  saved,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button
          onClick={onSave}
          disabled={saving || saved}
          size="sm"
          className={`gap-1.5 min-w-[72px] ${
            saved
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-50"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <><Check className="w-3.5 h-3.5" /> Saved</>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}

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
  const [apifyKey, setApifyKey] = useState('');
  const [instantlyKey, setInstantlyKey] = useState('');
  const [instantlyCampaignId, setInstantlyCampaignId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [valueProp, setValueProp] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const apify = useSaveField('apifyApiKey');
  const instantly = useSaveField('instantlyApiKey');
  const campaignId = useSaveField('instantlyCampaignId');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setApifyKey(data.apifyApiKey ?? '');
        setInstantlyKey(data.instantlyApiKey ?? '');
        setInstantlyCampaignId(data.instantlyCampaignId ?? '');
        setSenderName(data.senderName ?? '');
        setCompanyName(data.companyName ?? '');
        setValueProp(data.valueProposition ?? '');
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
        <p className="text-slate-500 text-sm mt-1">
          Configure your API keys and account preferences
        </p>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">API Keys</CardTitle>
          <p className="text-xs text-slate-500">Keys are stored per-user and never shared.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <ApiKeyInput
            label="Apify API Key"
            placeholder="apify_api_xxxxxxxxxxxx"
            value={apifyKey}
            onChange={setApifyKey}
            onSave={() => apify.save(apifyKey)}
            saving={apify.saving}
            saved={apify.saved}
          />
          <ApiKeyInput
            label="Instantly.ai API Key"
            placeholder="inst_xxxxxxxxxxxx"
            value={instantlyKey}
            onChange={setInstantlyKey}
            onSave={() => instantly.save(instantlyKey)}
            saving={instantly.saving}
            saved={instantly.saved}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Instantly Campaign ID</label>
            <p className="text-xs text-slate-400">Find this in your Instantly campaign URL: app.instantly.ai/app/campaign/<strong>campaign-id</strong>/...</p>
            <div className="flex gap-2">
              <input
                value={instantlyCampaignId}
                onChange={(e) => setInstantlyCampaignId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
              />
              <Button
                onClick={() => campaignId.save(instantlyCampaignId)}
                disabled={campaignId.saving || campaignId.saved}
                size="sm"
                className={`gap-1.5 min-w-[72px] ${
                  campaignId.saved
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-50'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {campaignId.saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : campaignId.saved ? (
                  <><Check className="w-3.5 h-3.5" /> Saved</>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900">Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Starter</p>
              <p className="text-xs text-slate-500">$49/mo · 200 prospects/month</p>
            </div>
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-sm">
              Upgrade
            </Button>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-indigo-500 w-[3.5%]" />
          </div>
          <p className="text-xs text-slate-400">7 of 200 prospects used this month</p>
        </CardContent>
      </Card>
    </div>
  );
}
