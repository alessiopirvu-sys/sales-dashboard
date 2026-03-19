import { ArrowDownToLine, Clock3, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  title: string;
  subtitle: string;
  lastUpdatedLabel: string;
  onExport: () => void;
  onAddSeller: () => void;
};

export function AppHeader({
  title,
  subtitle,
  lastUpdatedLabel,
  onExport,
  onAddSeller
}: AppHeaderProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-primary">{title}</p>
        <h1 className="font-display text-[1.4rem] font-semibold tracking-[-0.04em] text-slate-900 md:text-[1.75rem]">
          {subtitle}
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-500 md:text-sm">
          <Clock3 className="h-4 w-4 text-primary" />
          {lastUpdatedLabel}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 lg:flex-nowrap">
        <Button variant="secondary" onClick={onAddSeller} className="h-11 rounded-full px-5">
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi venditore
        </Button>
        <Button variant="secondary" onClick={onExport} className="h-11 rounded-full px-5">
          <ArrowDownToLine className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
