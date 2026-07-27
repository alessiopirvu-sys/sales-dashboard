"use client";

import { useEffect, useState } from "react";
import { Menu, LoaderCircle } from "lucide-react";
import { usePathname } from "next/navigation";

import { AppRole } from "@/lib/internal-kpi/types";
import { AppSidebar } from "@/components/layout/AppSidebar";

type AppShellProps = {
  role: AppRole;
  displayName: string;
  roleLabel: string;
  devMode?: boolean;
  children: React.ReactNode;
};

export function AppShell({ role, displayName, roleLabel, devMode = false, children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigationLabel, setNavigationLabel] = useState<string | null>(null);

  useEffect(() => {
    setNavigationLabel(null);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f7f7fa] text-slate-950">
      <AppSidebar
        role={role}
        displayName={displayName}
        roleLabel={roleLabel}
        devMode={devMode}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigateStart={setNavigationLabel}
      />
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
        <div className="relative px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {navigationLabel ? (
            <div className="absolute inset-0 z-30 flex items-start justify-center bg-[#f7f7fa]/70 px-4 py-6 backdrop-blur-[1px]">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                <span>Caricamento {navigationLabel.toLowerCase()}...</span>
              </div>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
