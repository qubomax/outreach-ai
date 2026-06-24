"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  Mail,
  BarChart2,
  Settings,
  CreditCard,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Prospects", href: "/prospects", icon: Users },
  { label: "Sequences", href: "/sequences", icon: Mail },
  { label: "Campaigns", href: "/campaigns", icon: BarChart2 },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Account", href: "/account", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen border-r border-slate-200 bg-white px-3 py-5">
      <div className="flex items-center gap-2 px-2 mb-8">
        <Zap className="w-5 h-5 text-indigo-500" />
        <span className="font-semibold text-slate-900 text-sm tracking-tight">
          outreach<span className="text-indigo-500">-ai</span>
        </span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-3 pb-4">
        <div className="px-2.5 py-2 flex items-center gap-2.5">
          <UserButton />
          <span className="text-xs text-slate-500">Account</span>
        </div>
        <Link
          href="/account"
          className="px-2.5 py-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors block"
        >
          <p className="text-xs text-slate-400 mb-1">Plan</p>
          <p className="text-sm font-semibold text-slate-900">Upgrade →</p>
          <p className="text-xs text-slate-500 mt-1">View plans &amp; billing</p>
        </Link>
      </div>
    </aside>
  );
}
