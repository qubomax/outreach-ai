"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isMarketingPage = pathname === "/";

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        {children}
      </div>
    );
  }

  if (isMarketingPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
