"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { AppSidebar } from "@/components/layout/AppSidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f7fa] text-slate-950">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[260px]">
        <div className="flex h-16 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            className="rounded-xl border border-slate-200 p-2 text-slate-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-3">
            <p className="font-display text-base font-semibold text-slate-900">Cold Sales</p>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
