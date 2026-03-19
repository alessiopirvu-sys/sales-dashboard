import { ArrowDownRight, ArrowUpRight, Euro, Goal, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

type ComparisonMetric = {
  label: string;
  currentValue: string;
  delta: number;
  icon: typeof Euro;
  isPercentage?: boolean;
};

type InsightCardProps = {
  revenue: number;
  previousRevenue: number;
  dealsClosed: number;
  previousDealsClosed: number;
  closingRate: number;
  previousClosingRate: number;
};

function getDelta(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

function TrendDelta({ delta, isPercentage = false }: { delta: number; isPercentage?: boolean }) {
  const positive = delta >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  const color = positive ? "text-emerald-600" : "text-rose-500";
  const sign = positive ? "+" : "";

  return (
    <div className={`mt-2 flex items-center gap-1 text-sm font-semibold ${color}`}>
      <Icon className="h-4 w-4" />
      {sign}
      {isPercentage ? delta.toFixed(1) : Math.round(delta)}%
    </div>
  );
}

export function InsightCard({
  revenue,
  previousRevenue,
  dealsClosed,
  previousDealsClosed,
  closingRate,
  previousClosingRate
}: InsightCardProps) {
  const metrics: ComparisonMetric[] = [
    {
      label: "Fatturato",
      currentValue: formatCurrency(revenue),
      delta: getDelta(revenue, previousRevenue),
      icon: Euro
    },
    {
      label: "Chiusi",
      currentValue: String(dealsClosed),
      delta: getDelta(dealsClosed, previousDealsClosed),
      icon: Goal
    },
    {
      label: "Closing su svolti",
      currentValue: formatPercentage(closingRate),
      delta: closingRate - previousClosingRate,
      icon: Target,
      isPercentage: true
    }
  ];

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-[2.2rem]">
      <CardHeader className="shrink-0 pb-3">
        <CardTitle className="text-[1.1rem] sm:text-[1.25rem]">Performance</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col justify-between gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="flex min-h-0 flex-1 flex-col justify-center rounded-[1.55rem] bg-slate-50/95 p-3 sm:p-3.5"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Icon className="h-4 w-4 text-primary" />
                {metric.label}
              </div>
              <div className="mt-2.5 text-[1.35rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[1.5rem] md:text-[1.6rem]">
                {metric.currentValue}
              </div>
              <TrendDelta delta={metric.delta} isPercentage={metric.isPercentage} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
