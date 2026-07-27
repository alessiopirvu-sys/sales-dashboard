"use client";

import { BarChart3, CalendarCheck2, Euro, Phone, Target, Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { InternalKpiPeriodSummary } from "@/lib/internal-kpi/types";

type Props = {
  totals: InternalKpiPeriodSummary;
};

const integerFormatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 0
});

const currencyFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

function formatMetric(value: number, type: "integer" | "currency" | "percentage") {
  if (type === "currency") {
    return currencyFormatter.format(value);
  }

  if (type === "percentage") {
    return `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(value)}%`;
  }

  return integerFormatter.format(value);
}

export function KpiTotals({ totals }: Props) {
  const metrics = [
    {
      label: "Totale chiamate",
      value: totals.total.input.frCalls,
      type: "integer" as const,
      icon: Phone
    },
    {
      label: "Totale contatti",
      value: totals.total.derived.frContacts,
      type: "integer" as const,
      icon: Target
    },
    {
      label: "Totale appuntamenti",
      value: totals.total.input.frAppointments,
      type: "integer" as const,
      icon: CalendarCheck2
    },
    {
      label: "Totale svolti",
      value: totals.total.input.frCompleted,
      type: "integer" as const,
      icon: BarChart3
    },
    {
      label: "Totale chiusi",
      value: totals.total.input.frClosed,
      type: "integer" as const,
      icon: Trophy
    },
    {
      label: "Incasso totale",
      value: totals.total.input.frRevenue + totals.total.input.referralRevenue + totals.total.input.officeRevenue + totals.total.input.d2dRevenue,
      type: "currency" as const,
      icon: Euro
    },
    {
      label: "Conversione complessiva",
      value: totals.total.derived.frAppointmentsConversionRate,
      type: "percentage" as const,
      icon: Target
    },
    {
      label: "Show-up complessivo",
      value: totals.total.derived.frShowUpRate,
      type: "percentage" as const,
      icon: BarChart3
    },
    {
      label: "Closing rate complessivo",
      value: totals.total.derived.frClosingRate,
      type: "percentage" as const,
      icon: Trophy
    },
    {
      label: "Ticket medio complessivo",
      value: totals.total.derived.frAverageTicket,
      type: "currency" as const,
      icon: Euro
    }
  ];

  return (
    <div className="grid gap-3 xl:grid-cols-5 md:grid-cols-2">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <Card key={metric.label} className="rounded-lg border-slate-200 shadow-none">
            <CardContent className="flex items-start justify-between p-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  {formatMetric(metric.value, metric.type)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <Icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
