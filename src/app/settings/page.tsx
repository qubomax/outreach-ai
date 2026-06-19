"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Check } from "lucide-react";

function ApiKeyInput({
  label,
  placeholder,
  defaultValue = "",
}: {
  label: string;
  placeholder: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
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
          onClick={handleSave}
          size="sm"
          className={`gap-1.5 ${
            saved
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-50"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
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
          <p className="text-xs text-slate-500">
            Keys are stored per-user and never shared.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <ApiKeyInput
            label="Apify API Key"
            placeholder="apify_api_xxxxxxxxxxxx"
          />
          <ApiKeyInput
            label="Instantly.ai API Key"
            placeholder="inst_xxxxxxxxxxxx"
          />
          <ApiKeyInput
            label="Anthropic API Key"
            placeholder="sk-ant-xxxxxxxxxxxx"
          />
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
                defaultValue="Alex"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Your Company</label>
              <input
                defaultValue="outreach-ai"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Value Proposition</label>
            <textarea
              rows={3}
              defaultValue="We help B2B sales teams send hyper-personalized cold emails at scale — automatically researching each prospect and generating a custom 3-step sequence per contact."
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-400">
              This is injected into every email sequence Claude generates.
            </p>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
            Save Profile
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
