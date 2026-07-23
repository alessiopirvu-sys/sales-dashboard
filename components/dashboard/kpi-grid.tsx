import { useState } from "react";
import {
  Activity,
  BadgeEuro,
  Building2,
  CalendarCheck2,
  CalendarPlus2,
  ChevronDown,
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
    <div className="relative col-span-2 overflow-hidden rounded-4xl border border-[#2F6BFF] bg-[#3B5BFF] text-white xl:col-span-4">
      <div className="p-6 md:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-base font-medium text-white/80 sm:text-lg">Fatturato FR</p>
            <p className="mt-4 text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
              {formatCurrency(revenue)}
            </p>
            <p className="mt-2 text-sm text-white/70">Contatti freddi - periodo selezionato</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15 sm:h-16 sm:w-16">
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
        className={`group col-span-1 overflow-hidden rounded-4xl border border-[#F59E0B] transition-transform duration-300 ${card.className}`}
        style={{ background: "#F59E0B" }}
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
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 transition-all duration-300 sm:h-14 sm:w-14">
              <Icon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (card.variant === "office-hero") {
    return (
      <div
        className={`group col-span-1 overflow-hidden rounded-4xl border border-[#7C3AED] transition-transform duration-300 ${card.className}`}
        style={{ background: "#7C3AED" }}
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
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 transition-all duration-300 sm:h-14 sm:w-14">
              <Icon className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={`group col-span-1 overflow-hidden transition-transform duration-300 ${card.surfaceClassName} ${card.className}`}
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
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 sm:h-14 sm:w-14 ${card.iconWrapClassName} ${card.iconClassName}`}
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
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#3B5BFF]",
    iconWrapClassName: "bg-[#EEF2FF]",
    iconClassName: "text-[#3B5BFF]"
  },
  {
    key: "appointmentsBooked",
    label: "App presi FR",
    icon: CalendarPlus2,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#3B5BFF]",
    iconWrapClassName: "bg-[#EEF2FF]",
    iconClassName: "text-[#3B5BFF]"
  },
  {
    key: "appointmentsDone",
    label: "Svolti FR",
    icon: CalendarCheck2,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#3B5BFF]",
    iconWrapClassName: "bg-[#EEF2FF]",
    iconClassName: "text-[#3B5BFF]"
  },
  {
    key: "dealsClosed",
    label: "Chiusi FR",
    icon: Target,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
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
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#3B5BFF]",
    iconWrapClassName: "bg-[#EEF2FF]",
    iconClassName: "text-[#3B5BFF]"
  },
  {
    key: "showUpRate",
    label: "% Show-up FR",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#3B5BFF]",
    iconWrapClassName: "bg-[#EEF2FF]",
    iconClassName: "text-[#3B5BFF]"
  },
  {
    key: "closingRate",
    label: "Closing su svolti FR",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#3B5BFF]",
    iconWrapClassName: "bg-[#EEF2FF]",
    iconClassName: "text-[#3B5BFF]"
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
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#F59E0B]",
    iconWrapClassName: "bg-[#FFF7ED]",
    iconClassName: "text-[#F59E0B]"
  },
  {
    key: "closedReferenze",
    label: "Chiusi Referenze",
    icon: UserCheck,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#F59E0B]",
    iconWrapClassName: "bg-[#FFF7ED]",
    iconClassName: "text-[#F59E0B]"
  },
  {
    key: "revenueReferenze",
    label: "Fatturato Referenze",
    icon: BadgeEuro,
    formatter: formatCurrency,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#F59E0B]",
    iconWrapClassName: "bg-[#FFF7ED]",
    iconClassName: "text-[#F59E0B]",
    variant: "referenze-hero"
  },
  {
    key: "conversionRateReferenze",
    label: "Conversione Ref. %",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#F59E0B]",
    iconWrapClassName: "bg-[#FFF7ED]",
    iconClassName: "text-[#F59E0B]"
  },
  {
    key: "averageValueReferenze",
    label: "Valore medio per Ref.",
    icon: Activity,
    formatter: formatCurrency,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#F59E0B]",
    iconWrapClassName: "bg-[#FFF7ED]",
    iconClassName: "text-[#F59E0B]"
  },
  {
    key: "averageTicketReferenze",
    label: "Ticket medio Ref.",
    icon: Activity,
    formatter: formatCurrency,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#F59E0B]",
    iconWrapClassName: "bg-[#FFF7ED]",
    iconClassName: "text-[#F59E0B]"
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
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#7C3AED]",
    iconWrapClassName: "bg-[#F5F3FF]",
    iconClassName: "text-[#7C3AED]"
  },
  {
    key: "appointmentsDoneOffice",
    label: "Svolti Ufficio",
    icon: CalendarCheck2,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#7C3AED]",
    iconWrapClassName: "bg-[#F5F3FF]",
    iconClassName: "text-[#7C3AED]"
  },
  {
    key: "noShowOffice",
    label: "No Show Ufficio",
    icon: UserX,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#7C3AED]",
    iconWrapClassName: "bg-[#F5F3FF]",
    iconClassName: "text-[#7C3AED]"
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
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#7C3AED]",
    iconWrapClassName: "bg-[#F5F3FF]",
    iconClassName: "text-[#7C3AED]",
    variant: "office-hero"
  },
  {
    key: "showUpRateOffice",
    label: "% Show-up Ufficio",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#7C3AED]",
    iconWrapClassName: "bg-[#F5F3FF]",
    iconClassName: "text-[#7C3AED]"
  },
  {
    key: "noShowRateOffice",
    label: "% No Show Ufficio",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#7C3AED]",
    iconWrapClassName: "bg-[#F5F3FF]",
    iconClassName: "text-[#7C3AED]"
  },
  {
    key: "closingRateOffice",
    label: "Closing Ufficio",
    icon: Percent,
    formatter: formatPercentage,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#7C3AED]",
    iconWrapClassName: "bg-[#F5F3FF]",
    iconClassName: "text-[#7C3AED]"
  },
  {
    key: "averageTicketOffice",
    label: "Ticket medio Ufficio",
    icon: Activity,
    formatter: formatCurrency,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#7C3AED]",
    iconWrapClassName: "bg-[#F5F3FF]",
    iconClassName: "text-[#7C3AED]"
  },
  {
    key: "rifissatoOffice",
    label: "Rifissati",
    icon: RefreshCw,
    formatter: formatCompactNumber,
    className: "xl:col-span-2",
    surfaceClassName: "border border-slate-200 bg-white",
    labelClassName: "text-[#7C3AED]",
    iconWrapClassName: "bg-[#F5F3FF]",
    iconClassName: "text-[#7C3AED]"
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
  const [isReferenzeOpen, setIsReferenzeOpen] = useState(true);
  const [isOfficeOpen, setIsOfficeOpen] = useState(true);

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
        <button
          type="button"
          onClick={() => setIsReferenzeOpen((current) => !current)}
          className="mb-4 flex items-center gap-2 text-left text-lg font-semibold text-slate-900"
        >
          <span>Referenze</span>
          <ChevronDown
            className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${
              isReferenzeOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>
        {isReferenzeOpen ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-6">
            {referenzeCards.map((card) => (
              <KpiCard key={card.key} card={card} summary={summary} />
            ))}
          </div>
        ) : null}
      </section>

      {/* Sezione: KPI Ufficio */}
      <section>
        <button
          type="button"
          onClick={() => setIsOfficeOpen((current) => !current)}
          className="mb-4 flex items-center gap-2 text-left text-lg font-semibold text-slate-900"
        >
          <span>Ufficio</span>
          <ChevronDown
            className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${
              isOfficeOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>
        {isOfficeOpen ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-6">
            {officeCards.map((card) => (
              <KpiCard key={card.key} card={card} summary={summary} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
