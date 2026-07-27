"use client";

import { CheckCircle2, CloudCog, Dot, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { InternalKpiSaveState } from "@/lib/internal-kpi/types";

type Props = {
  state: InternalKpiSaveState;
};

const SAVE_STATUS_MAP: Record<
  InternalKpiSaveState,
  { label: string; icon: typeof Dot; className: string }
> = {
  idle: {
    label: "Salvato",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700"
  },
  dirty: {
    label: "Modifiche non salvate",
    icon: Dot,
    className: "border-amber-200 bg-amber-50 text-amber-700"
  },
  saving: {
    label: "Salvataggio...",
    icon: CloudCog,
    className: "border-blue-200 bg-blue-50 text-blue-700"
  },
  saved: {
    label: "Salvato",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700"
  },
  error: {
    label: "Errore",
    icon: TriangleAlert,
    className: "border-rose-200 bg-rose-50 text-rose-700"
  }
};

export function KpiSaveStatus({ state }: Props) {
  const config = SAVE_STATUS_MAP[state];
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={`gap-2 rounded-full border ${config.className}`}>
      <Icon className={`h-3.5 w-3.5 ${state === "saving" ? "animate-spin" : ""}`} />
      {config.label}
    </Badge>
  );
}
