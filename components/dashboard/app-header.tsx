import { ArrowDownToLine, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  title: string;
  subtitle: string;
  lastUpdatedLabel: string;
  onExport: () => void;
};

export function AppHeader({
  title,
  subtitle,
  lastUpdatedLabel,
  onExport
}: AppHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">{subtitle}</p>
        <h1 className="font-display text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2rem]">
          {title}
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-500 md:text-sm">
          <Clock3 className="h-4 w-4 text-primary" />
          {lastUpdatedLabel}
        </div>
      </div>

      <div className="flex flex-wrap items-stretch gap-3 sm:items-center lg:justify-end lg:flex-nowrap">
        <Button variant="secondary" onClick={onExport} className="h-11 rounded-2xl px-5 max-sm:w-full">
          <ArrowDownToLine className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
