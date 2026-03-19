import { LayoutGrid, UserCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = ["Dashboard"];

type TopNavbarProps = {
  activeTab?: string;
};

export function TopNavbar({ activeTab = "Dashboard" }: TopNavbarProps) {
  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/80 px-3 py-3 sm:gap-4 sm:rounded-[2rem] sm:px-5 sm:py-4">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-primary/10 text-primary sm:h-12 sm:w-12 sm:rounded-[1.35rem]">
          <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            Cold Sales
          </p>
        </div>
      </div>

      <div className="surface-pill order-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/80 p-1.5 sm:order-none sm:w-auto sm:p-2">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 sm:px-5 sm:py-2.5",
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

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="surface-pill flex h-10 items-center gap-2 rounded-full border border-white/80 pl-1.5 pr-3 sm:h-11 sm:pl-2 sm:pr-4"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#d9ebff,#ffffff)] text-primary sm:h-8 sm:w-8">
            <UserCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <span className="text-sm font-semibold text-slate-700 max-[389px]:hidden">Daniele</span>
        </button>
      </div>
    </div>
  );
}
