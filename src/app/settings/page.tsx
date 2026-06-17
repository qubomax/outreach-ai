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
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white pr-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-600"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button
          onClick={handleSave}
          size="sm"
          className={`gap-1.5 ${
            saved
              ? "bg-emerald-800 text-emerald-300"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
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
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Configure your API keys and account preferences
        </p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white">API Keys</CardTitle>
          <p className="text-xs text-zinc-500">
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

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white">Sender Profile</CardTitle>
          <p className="text-xs text-zinc-500">
            Used to personalize the email sequences Claude generates.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Your Name</label>
              <input
                defaultValue="Alex"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Your Company</label>
              <input
                defaultValue="outreach-ai"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Value Proposition</label>
            <textarea
              rows={3}
              defaultValue="We help B2B sales teams send hyper-personalized cold emails at scale — automatically researching each prospect and generating a custom 3-step sequence per contact."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
            <p className="text-xs text-zinc-500">
              This is injected into every email sequence Claude generates.
            </p>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
            Save Profile
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-white">Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Starter</p>
              <p className="text-xs text-zinc-500">$49/mo · 200 prospects/month</p>
            </div>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white text-sm">
              Upgrade
            </Button>
          </div>
          <div className="h-2 rounded-full bg-zinc-800">
            <div className="h-2 rounded-full bg-indigo-500 w-[3.5%]" />
          </div>
          <p className="text-xs text-zinc-500">7 of 200 prospects used this month</p>
        </CardContent>
      </Card>
    </div>
  );
}
