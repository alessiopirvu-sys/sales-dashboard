import {
  Activity,
  BadgeEuro,
  CalendarCheck2,
  CalendarPlus2,
  PhoneCall,
  Percent,
  Target
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCompactNumber, formatCurrency, formatPercentage } from "@/lib/formatters";
import { SummaryMetrics } from "@/lib/types";

function RevenueHeroCard({ revenue }: { revenue: number }) {
  return (
    <div className="relative col-span-2 overflow-hidden rounded-[32px] border-0 bg-[#2F6BFF] text-white shadow-lg xl:col-span-4">
      <div className="p-6 md:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-base font-medium text-white/80 sm:text-lg">Fatturato totale</p>
            <p className="mt-4 text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
              {formatCurrency(revenue)}
            </p>
            <p className="mt-2 text-sm text-white/70">Metrica principale del periodo</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/15 sm:h-16 sm:w-16 sm:rounded-[24px]">
            <BadgeEuro className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

const cards = [
  {
    key: "calls",
    label: "Chiamate totali",
    icon: PhoneCall,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-sky-100 bg-sky-50",
    labelClassName: "text-sky-700",
    labelSizeClassName: "text-sm",
    valueClassName: undefined,
    subtitleClassName: undefined,
    iconWrapClassName: "bg-sky-100",
    iconWrapRadiusClassName: "rounded-[1.35rem]",
    iconClassName: "text-sky-600"
  },
  {
    key: "appointmentsBooked",
    label: "Appuntamenti presi",
    icon: CalendarPlus2,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-sky-100 bg-sky-50",
    labelClassName: "text-sky-700",
    labelSizeClassName: "text-sm",
    valueClassName: undefined,
    subtitleClassName: undefined,
    iconWrapClassName: "bg-sky-100",
    iconWrapRadiusClassName: "rounded-[1.35rem]",
    iconClassName: "text-sky-600"
  },
  {
    key: "appointmentsDone",
    label: "Appuntamenti svolti",
    icon: CalendarCheck2,
    formatter: formatCompactNumber,
    className: "xl:col-span-2 xl:row-span-1",
    surfaceClassName: "border border-sky-100 bg-sky-50",
    labelClassName: "text-sky-700",
    labelSizeClassName: "text-sm",
    valueClassName: undefined,
    subtitleClassName: undefined,
    iconWrapClassName: "bg-sky-100",
    iconWrapRadiusClassName: "rounded-[1.35rem]",
    iconClassName: "text-sky-600"
  },
  {
    key: "dealsClosed",
    label: "Chiusi",
    icon: Target,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-100 bg-slate-50",
    labelClassName: "text-slate-700",
    labelSizeClassName: "text-sm",
    valueClassName: undefined,
    subtitleClassName: undefined,
    iconWrapClassName: "bg-slate-100",
    iconWrapRadiusClassName: "rounded-[1.35rem]",
    iconClassName: "text-slate-600"
  },
  {
    key: "revenue",
    label: "Fatturato totale",
    icon: BadgeEuro,
    formatter: formatCurrency,
    className: "xl:col-span-4",
    surfaceClassName: "",
    labelClassName: "",
    labelSizeClassName: "text-sm",
    valueClassName: undefined,
    subtitleClassName: undefined,
    iconWrapClassName: "",
    iconWrapRadiusClassName: "rounded-[1.35rem]",
    iconClassName: ""
  },
  {
    key: "averageTicket",
    label: "Ticket medio",
    icon: Activity,
    formatter: formatCurrency,
    className: "xl:col-span-2",
    surfaceClassName: "border border-indigo-100 bg-indigo-50",
    labelClassName: "text-indigo-700",
    labelSizeClassName: "text-sm",
    valueClassName: undefined,
    subtitleClassName: undefined,
    iconWrapClassName: "bg-indigo-100",
    iconWrapRadiusClassName: "rounded-[1.35rem]",
    iconClassName: "text-indigo-600"
  },
  {
    key: "showUpRate",
    label: "% Show-up",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-emerald-100 bg-emerald-50",
    labelClassName: "text-emerald-700",
    labelSizeClassName: "text-sm",
    valueClassName: undefined,
    subtitleClassName: undefined,
    iconWrapClassName: "bg-emerald-100",
    iconWrapRadiusClassName: "rounded-[1.35rem]",
    iconClassName: "text-emerald-600"
  },
  {
    key: "closingRate",
    label: "Closing su svolti",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-emerald-100 bg-emerald-50",
    labelClassName: "text-emerald-700",
    labelSizeClassName: "text-sm",
    valueClassName: undefined,
    subtitleClassName: undefined,
    iconWrapClassName: "bg-emerald-100",
    iconWrapRadiusClassName: "rounded-[1.35rem]",
    iconClassName: "text-emerald-600"
  }
] as const;

type KpiGridProps = {
  summary: SummaryMetrics;
};

export function KpiGrid({ summary }: KpiGridProps) {
  return (
    <section className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-6">
      {cards.map((card) => {
        if (card.key === "revenue") {
          return <RevenueHeroCard key={card.key} revenue={summary.revenue} />;
        }

        const Icon = card.icon;
        const value = summary[card.key];
        const isClosed = card.key === "dealsClosed";
        const isDone = card.key === "appointmentsDone";

        return (
          <Card
            key={card.key}
            className={`group col-span-1 overflow-hidden rounded-[2.25rem] transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-float ${card.surfaceClassName} ${card.className}`}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className={`${card.labelSizeClassName} font-medium ${card.labelClassName}`}>
                    {card.label}
                  </p>
                  <p
                    className={`mt-3 font-semibold tracking-[-0.04em] ${card.valueClassName ?? "text-slate-950"} ${
                      isClosed || isDone ? "text-[1.8rem] sm:text-[2.2rem]" : "text-[1.65rem] sm:text-[2rem]"
                    }`}
                  >
                    {card.formatter(value)}
                  </p>
                </div>
                <div
                  className={`flex items-center justify-center transition-all duration-300 ${
                    "h-11 w-11 sm:h-14 sm:w-14"
                  } ${card.iconWrapRadiusClassName} ${card.iconWrapClassName} ${card.iconClassName}`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
