"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Mail,
  BarChart2,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Prospects", href: "/prospects", icon: Users },
  { label: "Sequences", href: "/sequences", icon: Mail },
  { label: "Campaigns", href: "/campaigns", icon: BarChart2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen border-r border-zinc-800 bg-zinc-950 px-3 py-5">
      <div className="flex items-center gap-2 px-2 mb-8">
        <Zap className="w-5 h-5 text-indigo-400" />
        <span className="font-semibold text-white text-sm tracking-tight">
          outreach<span className="text-indigo-400">-ai</span>
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors",
              pathname === href
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto px-2 py-3 rounded-md bg-zinc-900 border border-zinc-800">
        <p className="text-xs text-zinc-500 mb-1">Plan</p>
        <p className="text-sm font-medium text-white">Starter — $49/mo</p>
        <p className="text-xs text-zinc-500 mt-1">7 / 200 prospects used</p>
        <div className="mt-2 h-1 rounded-full bg-zinc-800">
          <div className="h-1 rounded-full bg-indigo-500 w-[3.5%]" />
        </div>
      </div>
    </aside>
  );
}
