import { LayoutGrid, UserCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = ["Dashboard"];

type TopNavbarProps = {
  activeTab?: string;
};

export function TopNavbar({ activeTab = "Dashboard" }: TopNavbarProps) {
  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/80 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-primary/10 text-primary">
          <LayoutGrid className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-slate-900">
            Cold Sales
          </p>
        </div>
      </div>

      <div className="surface-pill flex flex-wrap items-center gap-2 rounded-full border border-white/80 p-2">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-primary text-white shadow-soft"
                  : "text-slate-500 hover:bg-white/90 hover:text-slate-900"
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="surface-pill flex h-11 items-center gap-2 rounded-full border border-white/80 pl-2 pr-4"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#d9ebff,#ffffff)] text-primary">
            <UserCircle2 className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Daniele</span>
        </button>
      </div>
    </div>
  );
}
