import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRankingMetricConfig,
  RankingMetricKey,
  rankingMetricOptions
} from "@/components/dashboard/ranking-metrics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  formatCompactNumber,
  formatCurrency,
  formatPercentage
} from "@/lib/formatters";
import { RankingRow } from "@/lib/types";
import { cn } from "@/lib/utils";

type LeaderboardTableProps = {
  rows: RankingRow[];
  activeMetric: RankingMetricKey;
  onMetricChange: (metric: RankingMetricKey) => void;
  className?: string;
};

export const LeaderboardTable = React.forwardRef<HTMLDivElement, LeaderboardTableProps>(function LeaderboardTable(
  {
    rows,
    activeMetric,
    onMetricChange,
    className
  },
  ref
) {
  const activeMetricConfig = getRankingMetricConfig(activeMetric);

  return (
    <Card
      ref={ref}
      className={cn("w-full max-w-full self-start overflow-hidden rounded-[2.35rem]", className)}
    >
      <CardHeader className="pb-4 max-sm:px-4 max-sm:pt-5">
        <div className="space-y-4">
          <CardTitle className="text-[1.35rem]">Venditori</CardTitle>
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="flex min-w-max gap-2">
              {rankingMetricOptions.map((metric) => {
                const isActive = metric.key === activeMetric;

                return (
                  <button
                    key={metric.key}
                    type="button"
                    onClick={() => onMetricChange(metric.key)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                      isActive
                        ? "bg-primary text-white shadow-soft"
                        : "border border-white/80 bg-white/75 text-slate-600 hover:bg-white hover:text-slate-900"
                    )}
                  >
                    {metric.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="w-full max-w-full max-sm:px-4 max-sm:pb-4">
        <div className="hidden h-auto overflow-hidden rounded-[1.9rem] border border-slate-100 bg-white/70 md:block">
          <Table>
            <TableHeader className="bg-[linear-gradient(180deg,rgba(248,250,255,0.98),rgba(244,247,252,0.98))]">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Chiamate</TableHead>
                <TableHead>App presi</TableHead>
                <TableHead>Svolti</TableHead>
                <TableHead>Chiusi</TableHead>
                <TableHead>Fatturato</TableHead>
                <TableHead>Ticket medio</TableHead>
                <TableHead>Show-up %</TableHead>
                <TableHead>Closing su svolti %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow key={row.seller} className="hover:bg-[#f7faff]">
                    <TableCell className="font-semibold text-slate-900">{row.seller}</TableCell>
                    <TableCell>{formatCompactNumber(row.calls)}</TableCell>
                    <TableCell>{formatCompactNumber(row.appointmentsBooked)}</TableCell>
                    <TableCell>{formatCompactNumber(row.appointmentsDone)}</TableCell>
                    <TableCell>{formatCompactNumber(row.dealsClosed)}</TableCell>
                    <TableCell>{formatCurrency(row.revenue)}</TableCell>
                    <TableCell>{formatCurrency(row.averageTicket)}</TableCell>
                    <TableCell>{formatPercentage(row.showUpRate)}</TableCell>
                    <TableCell>{formatPercentage(row.closingRate)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center text-slate-500">
                    Nessun dato trovato con i filtri attivi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="w-full max-w-full space-y-3 overflow-x-hidden md:hidden">
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <div
                key={row.seller}
                className="w-full max-w-full min-w-0 rounded-[1.6rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,249,255,0.94))] p-3.5 shadow-[0_18px_34px_-32px_rgba(46,87,173,0.28)] sm:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-slate-900">{row.seller}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Ranking: {index + 1}° per {activeMetricConfig.tableLabel}
                    </p>
                  </div>
                  <div className="max-w-[42%] shrink-0 truncate rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {activeMetricConfig.format(activeMetricConfig.getValue(row))}
                  </div>
                </div>
                <div className="mt-4 grid w-full min-w-0 grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="min-w-0 rounded-[1.2rem] bg-slate-50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Fatturato</p>
                    <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                      {formatCurrency(row.revenue)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-[1.2rem] bg-slate-50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Chiusi</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatCompactNumber(row.dealsClosed)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-[1.2rem] bg-slate-50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Svolti</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatCompactNumber(row.appointmentsDone)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-[1.2rem] bg-slate-50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Show-up</p>
                    <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                      {formatPercentage(row.showUpRate)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-[1.2rem] bg-slate-50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Closing</p>
                    <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                      {formatPercentage(row.closingRate)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-[1.2rem] bg-slate-50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Chiamate</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatCompactNumber(row.calls)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.6rem] border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
              Nessun dato trovato con i filtri attivi.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
