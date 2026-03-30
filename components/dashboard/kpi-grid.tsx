import {
  Activity,
  BadgeEuro,
  Building2,
  CalendarCheck2,
  CalendarPlus2,
  PhoneCall,
  Percent,
  RefreshCw,
  Target,
  UserCheck,
  UserX,
  Users
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCompactNumber, formatCurrency, formatPercentage } from "@/lib/formatters";
import { SummaryMetrics } from "@/lib/types";

type KpiCardDef = {
  key: keyof SummaryMetrics;
  label: string;
  icon: typeof PhoneCall;
  formatter: (value: number) => string;
  className: string;
  surfaceClassName: string;
  labelClassName: string;
  iconWrapClassName: string;
  iconClassName: string;
  variant?: "referenze-hero" | "office-hero";
};

function RevenueHeroCard({ revenue }: { revenue: number }) {
  return (
    <div className="relative col-span-2 overflow-hidden rounded-[32px] border-0 bg-[#2F6BFF] text-white shadow-lg xl:col-span-4">
      <div className="p-6 md:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-base font-medium text-white/80 sm:text-lg">Fatturato FR</p>
            <p className="mt-4 text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
              {formatCurrency(revenue)}
            </p>
            <p className="mt-2 text-sm text-white/70">Contatti freddi - periodo selezionato</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/15 sm:h-16 sm:w-16 sm:rounded-[24px]">
            <BadgeEuro className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ card, summary }: { card: KpiCardDef; summary: SummaryMetrics }) {
  const Icon = card.icon;
  const value = summary[card.key];

  if (card.variant === "referenze-hero") {
    return (
      <div
        className={`group col-span-1 overflow-hidden rounded-[2.25rem] shadow-lg transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-float ${card.className}`}
        style={{ background: "#FFF4CC" }}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {card.label}
              </p>
              <p className="mt-3 text-[1.65rem] font-semibold tracking-[-0.04em] text-black sm:text-[2rem]">
                {card.formatter(value)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.35rem] bg-amber-400/25 transition-all duration-300 sm:h-14 sm:w-14">
              <Icon className="h-4 w-4 text-amber-600 sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (card.variant === "office-hero") {
    return (
      <div
        className={`group col-span-1 overflow-hidden rounded-[2.25rem] shadow-lg transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-float ${card.className}`}
        style={{ background: "#6C5CE7" }}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-sm font-medium text-white/80">
                {card.label}
              </p>
              <p className="mt-3 text-[1.65rem] font-semibold tracking-[-0.04em] text-white sm:text-[2rem]">
                {card.formatter(value)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.35rem] bg-white/15 transition-all duration-300 sm:h-14 sm:w-14">
              <Icon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={`group col-span-1 overflow-hidden rounded-[2.25rem] transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-float ${card.surfaceClassName} ${card.className}`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-sm font-medium ${card.labelClassName}`}>
              {card.label}
            </p>
            <p className="mt-3 text-[1.65rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2rem]">
              {card.formatter(value)}
            </p>
          </div>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-[1.35rem] transition-all duration-300 sm:h-14 sm:w-14 ${card.iconWrapClassName} ${card.iconClassName}`}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Sezione A: KPI Freddi ── */

const frCards: KpiCardDef[] = [
  {
    key: "calls",
    label: "Chiamate FR",
    icon: PhoneCall,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-sky-100 bg-sky-50",
    labelClassName: "text-sky-700",
    iconWrapClassName: "bg-sky-100",
    iconClassName: "text-sky-600"
  },
  {
    key: "appointmentsBooked",
    label: "App presi FR",
    icon: CalendarPlus2,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-sky-100 bg-sky-50",
    labelClassName: "text-sky-700",
    iconWrapClassName: "bg-sky-100",
    iconClassName: "text-sky-600"
  },
  {
    key: "appointmentsDone",
    label: "Svolti FR",
    icon: CalendarCheck2,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-sky-100 bg-sky-50",
    labelClassName: "text-sky-700",
    iconWrapClassName: "bg-sky-100",
    iconClassName: "text-sky-600"
  },
  {
    key: "dealsClosed",
    label: "Chiusi FR",
    icon: Target,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-100 bg-slate-50",
    labelClassName: "text-slate-700",
    iconWrapClassName: "bg-slate-100",
    iconClassName: "text-slate-600"
  },
  {
    key: "averageTicket",
    label: "Ticket medio FR",
    icon: Activity,
    formatter: formatCurrency,
    className: "xl:col-span-2",
    surfaceClassName: "border border-indigo-100 bg-indigo-50",
    labelClassName: "text-indigo-700",
    iconWrapClassName: "bg-indigo-100",
    iconClassName: "text-indigo-600"
  },
  {
    key: "showUpRate",
    label: "% Show-up FR",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-emerald-100 bg-emerald-50",
    labelClassName: "text-emerald-700",
    iconWrapClassName: "bg-emerald-100",
    iconClassName: "text-emerald-600"
  },
  {
    key: "closingRate",
    label: "Closing su svolti FR",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-emerald-100 bg-emerald-50",
    labelClassName: "text-emerald-700",
    iconWrapClassName: "bg-emerald-100",
    iconClassName: "text-emerald-600"
  }
];

/* ── Sezione: KPI Referenze ── */

const referenzeCards: KpiCardDef[] = [
  {
    key: "referenze",
    label: "Referenze",
    icon: Users,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-amber-100 bg-amber-50",
    labelClassName: "text-amber-700",
    iconWrapClassName: "bg-amber-100",
    iconClassName: "text-amber-600"
  },
  {
    key: "closedReferenze",
    label: "Chiusi Referenze",
    icon: UserCheck,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-amber-100 bg-amber-50",
    labelClassName: "text-amber-700",
    iconWrapClassName: "bg-amber-100",
    iconClassName: "text-amber-600"
  },
  {
    key: "revenueReferenze",
    label: "Fatturato Referenze",
    icon: BadgeEuro,
    formatter: formatCurrency,
    className: "xl:col-span-2",
    surfaceClassName: "border border-amber-100 bg-amber-50",
    labelClassName: "text-amber-700",
    iconWrapClassName: "bg-amber-100",
    iconClassName: "text-amber-600",
    variant: "referenze-hero"
  },
  {
    key: "conversionRateReferenze",
    label: "Conversione Ref. %",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-orange-100 bg-orange-50",
    labelClassName: "text-orange-700",
    iconWrapClassName: "bg-orange-100",
    iconClassName: "text-orange-600"
  },
  {
    key: "averageValueReferenze",
    label: "Valore medio per Ref.",
    icon: Activity,
    formatter: formatCurrency,
    className: "xl:col-span-2",
    surfaceClassName: "border border-orange-100 bg-orange-50",
    labelClassName: "text-orange-700",
    iconWrapClassName: "bg-orange-100",
    iconClassName: "text-orange-600"
  },
  {
    key: "averageTicketReferenze",
    label: "Ticket medio Ref.",
    icon: Activity,
    formatter: formatCurrency,
    className: "xl:col-span-2",
    surfaceClassName: "border border-orange-100 bg-orange-50",
    labelClassName: "text-orange-700",
    iconWrapClassName: "bg-orange-100",
    iconClassName: "text-orange-600"
  }
];

/* ── Sezione: KPI Ufficio ── */

const officeCards: KpiCardDef[] = [
  {
    key: "officeBase",
    label: "Totale Ufficio",
    icon: Building2,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-violet-100 bg-violet-50",
    labelClassName: "text-violet-700",
    iconWrapClassName: "bg-violet-100",
    iconClassName: "text-violet-600"
  },
  {
    key: "appointmentsDoneOffice",
    label: "Svolti Ufficio",
    icon: CalendarCheck2,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-violet-100 bg-violet-50",
    labelClassName: "text-violet-700",
    iconWrapClassName: "bg-violet-100",
    iconClassName: "text-violet-600"
  },
  {
    key: "noShowOffice",
    label: "No Show Ufficio",
    icon: UserX,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-violet-100 bg-violet-50",
    labelClassName: "text-violet-700",
    iconWrapClassName: "bg-violet-100",
    iconClassName: "text-violet-600"
  },
  {
    key: "closedOffice",
    label: "Chiusi Ufficio",
    icon: Target,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-violet-100 bg-violet-50",
    labelClassName: "text-violet-700",
    iconWrapClassName: "bg-violet-100",
    iconClassName: "text-violet-600"
  },
  {
    key: "revenueOffice",
    label: "Fatturato Ufficio",
    icon: BadgeEuro,
    formatter: formatCurrency,
    className: "xl:col-span-2",
    surfaceClassName: "border border-violet-100 bg-violet-50",
    labelClassName: "text-violet-700",
    iconWrapClassName: "bg-violet-100",
    iconClassName: "text-violet-600",
    variant: "office-hero"
  },
  {
    key: "showUpRateOffice",
    label: "% Show-up Ufficio",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-purple-100 bg-purple-50",
    labelClassName: "text-purple-700",
    iconWrapClassName: "bg-purple-100",
    iconClassName: "text-purple-600"
  },
  {
    key: "noShowRateOffice",
    label: "% No Show Ufficio",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-purple-100 bg-purple-50",
    labelClassName: "text-purple-700",
    iconWrapClassName: "bg-purple-100",
    iconClassName: "text-purple-600"
  },
  {
    key: "closingRateOffice",
    label: "Closing Ufficio",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-purple-100 bg-purple-50",
    labelClassName: "text-purple-700",
    iconWrapClassName: "bg-purple-100",
    iconClassName: "text-purple-600"
  },
  {
    key: "averageTicketOffice",
    label: "Ticket medio Ufficio",
    icon: Activity,
    formatter: formatCurrency,
    className: "xl:col-span-2",
    surfaceClassName: "border border-purple-100 bg-purple-50",
    labelClassName: "text-purple-700",
    iconWrapClassName: "bg-purple-100",
    iconClassName: "text-purple-600"
  },
  {
    key: "rifissatoOffice",
    label: "Rifissati",
    icon: RefreshCw,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-purple-100 bg-purple-50",
    labelClassName: "text-purple-700",
    iconWrapClassName: "bg-purple-100",
    iconClassName: "text-purple-600"
  },
  {
    key: "recoveryRateOffice",
    label: "% Recupero No Show",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-purple-100 bg-purple-50",
    labelClassName: "text-purple-700",
    iconWrapClassName: "bg-purple-100",
    iconClassName: "text-purple-600"
  }
];

type KpiGridProps = {
  summary: SummaryMetrics;
};

export function KpiGrid({ summary }: KpiGridProps) {
  return (
    <div className="space-y-6">
      {/* Sezione A: KPI Freddi */}
      <section className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-6">
        <RevenueHeroCard revenue={summary.revenue} />
        {frCards.map((card) => (
          <KpiCard key={card.key} card={card} summary={summary} />
        ))}
      </section>

      {/* Sezione: KPI Referenze */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-slate-700">Referenze</h3>
        <div className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-6">
          {referenzeCards.map((card) => (
            <KpiCard key={card.key} card={card} summary={summary} />
          ))}
        </div>
      </section>

      {/* Sezione: KPI Ufficio */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-slate-700">Ufficio</h3>
        <div className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-6">
          {officeCards.map((card) => (
            <KpiCard key={card.key} card={card} summary={summary} />
          ))}
        </div>
      </section>
    </div>
  );
}
