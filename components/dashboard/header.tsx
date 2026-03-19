import { ArrowUpRight, Clock3, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type DashboardHeaderProps = {
  lastUpdatedLabel: string;
  activeSeller: string;
  isLoading: boolean;
};

export function DashboardHeader({
  lastUpdatedLabel,
  activeSeller,
  isLoading
}: DashboardHeaderProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
      <div className="space-y-6">
        <Badge className="w-fit rounded-full bg-primary/10 px-4 py-2 text-[11px] uppercase tracking-[0.26em] text-primary hover:bg-primary/10">
          Live sales leaderboard
        </Badge>

        <div className="space-y-4">
          <h1 className="max-w-4xl text-balance font-display text-[2.9rem] font-semibold leading-[0.98] tracking-[-0.05em] text-slate-900 md:text-[4.6rem]">
            Una dashboard chiara e premium per leggere davvero le performance del team.
          </h1>
          <p className="max-w-2xl text-[1.04rem] leading-8 text-slate-500 md:text-lg">
            Trend, ranking e conversioni in una composizione luminosa, ariosa e credibile.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="surface-pill flex items-center gap-2 rounded-full border border-white/80 px-4 py-3 text-sm text-slate-600">
            <Sparkles className="h-4 w-4 text-primary" />
            Premium SaaS layout
          </div>
          <div className="surface-pill flex items-center gap-2 rounded-full border border-white/80 px-4 py-3 text-sm text-slate-600">
            <ArrowUpRight className="h-4 w-4 text-primary" />
            KPI live aggregati
          </div>
        </div>
      </div>

      <div className="surface-card grid gap-5 rounded-[2.25rem] border border-white/80 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-400">Focus corrente</p>
            <p className="mt-2 text-[1.65rem] font-semibold tracking-tight text-slate-900">
              {activeSeller}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-primary text-white shadow-soft">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-4 rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(244,248,255,0.96),rgba(249,251,255,0.92))] p-5">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock3 className="h-4 w-4 text-primary" />
            Ultimo aggiornamento
          </div>
          <p className="text-base font-semibold text-slate-900">{lastUpdatedLabel}</p>
          <p className="text-sm leading-7 text-slate-500">
            {isLoading ? "Sincronizzazione in corso…" : "Dati aggregati dal layer server-side."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.6rem] bg-slate-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Esperienza</p>
            <p className="mt-2 text-base font-semibold text-slate-900">Pulita e luminosa</p>
          </div>
          <div className="rounded-[1.6rem] bg-slate-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Output</p>
            <p className="mt-2 text-base font-semibold text-slate-900">Deploy-ready</p>
          </div>
        </div>
      </div>
    </section>
  );
}
