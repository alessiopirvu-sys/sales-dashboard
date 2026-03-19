import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
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
  return (
    <Card ref={ref} className={cn("self-start overflow-hidden rounded-[2.35rem]", className)}>
      <CardHeader className="pb-4">
        <div className="space-y-4">
          <CardTitle className="text-[1.35rem]">Venditori</CardTitle>
          <div className="flex flex-wrap gap-2">
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
      </CardHeader>
      <CardContent>
        <div className="h-auto overflow-hidden rounded-[1.9rem] border border-slate-100 bg-white/70">
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
      </CardContent>
    </Card>
  );
});
