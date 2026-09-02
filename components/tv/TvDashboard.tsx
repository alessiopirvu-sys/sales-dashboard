"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { BadgeEuro, LayoutGrid, LoaderCircle, Target, TrendingDown, TrendingUp, Trophy, Users } from "lucide-react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";
import { formatCurrency, formatCompactNumber } from "@/lib/formatters";
import { formatCurrency as formatTeamCurrency } from "@/lib/team-sales/workbook";
import { DashboardResponse, RankingRow, SellerRecord } from "@/lib/types";
import { TeamSalesOverviewRow } from "@/lib/team-sales/types";
import { SaleCelebration, SaleCelebrationHandle } from "@/components/tv/SaleCelebration";

// Piu' frequente del solito (era 60s): cosi' i coriandoli partono a pochi
// secondi dall'inserimento di una vendita, non dopo un minuto intero.
const REFRESH_INTERVAL_MS = 20_000;

const EMPTY_RANKING_ROW: RankingRow = {
  seller: "",
  calls: 0,
  appointmentsBooked: 0,
  appointmentsDone: 0,
  dealsClosed: 0,
  revenue: 0,
  averageTicket: 0,
  conversionRate: 0,
  showUpRate: 0,
  closingRate: 0,
  referenze: 0,
  closedReferenze: 0,
  revenueReferenze: 0,
  conversionRateReferenze: 0,
  averageValueReferenze: 0,
  averageTicketReferenze: 0,
  officeBase: 0,
  appointmentsDoneOffice: 0,
  noShowOffice: 0,
  closedOffice: 0,
  revenueOffice: 0,
  showUpRateOffice: 0,
  noShowRateOffice: 0,
  closingRateOffice: 0,
  averageTicketOffice: 0,
  rifissatoOffice: 0,
  recoveryRateOffice: 0,
  dealsClosedTotal: 0,
  revenueTotal: 0,
  averageTicketTotal: 0
};

// Famiglia monocromatica sul viola del brand (come nella reference: un solo
// accento, in tonalita' diverse, non un arcobaleno di colori diversi).
const TEAM_CHART_COLORS = ["#7C3AED", "#A78BFA", "#4C1D95", "#C4B5FD", "#5B21B6"];

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function computeDelta(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Superficie "Apple-like": niente bordi netti, solo un'ombra morbida e
// diffusa a separare le card dallo sfondo, con angoli molto arrotondati.
const SURFACE = "bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.14)]";

function DeltaBadge({ delta }: { delta: number }) {
  const isPositive = delta >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
      )}
    >
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

function HeroStatCard({ label, value, delta, description }: { label: string; value: string; delta: number; description: string }) {
  return (
    <div className="col-span-1 overflow-hidden rounded-[1.1rem] bg-primary px-6 py-4 text-white shadow-[0_18px_36px_-16px_rgba(124,58,237,0.5)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium tracking-tight text-white/70">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
          <BadgeEuro className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-[2.6rem] font-bold leading-none tracking-[-0.04em]">{value}</p>
      <div className="mt-2.5 flex items-center gap-2 text-xs text-white/70">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
          {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(delta).toFixed(1)}%
        </span>
        {description}
      </div>
    </div>
  );
}

// Tinte pastello per le 3 card statistiche accanto a quella "hero": stesso
// accento del brand, in versioni piu' chiare, cosi' non sono tutte bianche
// ma restano coerenti (niente arcobaleno scollegato dal resto).
const STAT_TINTS = {
  violet: { bg: "bg-[#F3EFFE]", iconBg: "bg-primary/15", iconColor: "text-primary" },
  sky: { bg: "bg-[#EAF2FF]", iconBg: "bg-[#2563EB]/15", iconColor: "text-[#2563EB]" },
  amber: { bg: "bg-[#FFF6E9]", iconBg: "bg-[#D97706]/15", iconColor: "text-[#D97706]" },
  gray: { bg: "bg-slate-100", iconBg: "bg-slate-900/10", iconColor: "text-slate-600" }
} as const;

function StatCard({
  label,
  value,
  delta,
  description,
  icon: Icon,
  tint = "violet"
}: {
  label: string;
  value: string;
  delta?: number;
  description: string;
  icon: typeof Target;
  tint?: keyof typeof STAT_TINTS;
}) {
  const palette = STAT_TINTS[tint];
  return (
    <div
      className={cn(
        "col-span-1 rounded-[1.1rem] px-6 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_28px_-18px_rgba(15,23,42,0.16)]",
        palette.bg
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium tracking-tight text-slate-500">{label}</p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", palette.iconBg)}>
          <Icon className={cn("h-4 w-4", palette.iconColor)} />
        </div>
      </div>
      <p className="mt-2 text-[2.6rem] font-bold leading-none tracking-[-0.04em] text-slate-950">{value}</p>
      <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
        {delta !== undefined ? <DeltaBadge delta={delta} /> : null}
        {description}
      </div>
    </div>
  );
}

function HalfCircleGaugeStatCard({ label, percent, description }: { label: string; percent: number; description: string }) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className={cn("col-span-1 flex flex-col rounded-[1.1rem] px-6 py-2", SURFACE)}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium tracking-tight text-slate-500">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Target className="h-4 w-4 text-primary" />
        </div>
      </div>
      <div className="relative flex-1">
        <svg viewBox="0 0 200 108" className="absolute inset-0 h-full w-full overflow-visible">
          <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#f1f5f9" strokeWidth="18" strokeLinecap="round" />
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke="#7C3AED"
            strokeWidth="18"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 - clamped}
          />
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
          <p className="text-[2.6rem] font-bold leading-none tracking-[-0.04em] text-slate-950">{Math.round(percent)}%</p>
        </div>
      </div>
      <p className="text-center text-[11px] text-slate-500">{description}</p>
    </div>
  );
}

// Etichette sempre visibili sulle barre: sulla TV nessuno passa il mouse
// sopra un tooltip, quindi il valore deve stare stampato accanto alla barra.
function BarValueLabel({ x, y, width, height, formatted, dark }: any) {
  return (
    <text
      x={x + width + 10}
      y={y + height / 2}
      dy={5}
      textAnchor="start"
      className={cn("text-[13px] font-bold", dark ? "fill-white" : "fill-slate-900")}
    >
      {formatted}
    </text>
  );
}

function TeamsBarChart({ teams }: { teams: TeamSalesOverviewRow[] }) {
  // Chi vende di piu' sta in alto, chi vende di meno in basso.
  const chartData = teams
    .map((team) => {
      const progress = team.targetTotal > 0 ? team.soldTotal / team.targetTotal : 0;
      return {
        name: team.teamName,
        venduto: team.soldTotal,
        label: `${formatTeamCurrency(team.soldTotal)} (${Math.round(progress * 100)}%)`
      };
    })
    .sort((a, b) => b.venduto - a.venduto);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        barCategoryGap="14%"
        margin={{ top: 4, right: 100, bottom: 4, left: 4 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 13, fontWeight: 600, fill: "#334155" }}
        />
        <Bar dataKey="venduto" radius={[6, 6, 6, 6]} background={{ fill: "#f8fafc", radius: 6 }}>
          {chartData.map((entry, index) => (
            <Cell key={entry.name} fill={TEAM_CHART_COLORS[index % TEAM_CHART_COLORS.length]} />
          ))}
          <LabelList dataKey="label" content={(props: any) => <BarValueLabel {...props} formatted={props.value} />} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function getSurname(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] || fullName;
}

function buildSellerChartData(rows: RankingRow[], sellerTargets: Record<string, number>) {
  return rows
    .map((row) => {
      const target = sellerTargets[row.seller] ?? 0;
      const percent = target > 0 ? (row.revenueTotal / target) * 100 : 0;
      return {
        name: getSurname(row.seller),
        revenue: row.revenueTotal,
        percent,
        hasTarget: target > 0,
        label: target > 0 ? `${formatCurrency(row.revenueTotal)} · ${Math.round(percent)}%` : `${formatCurrency(row.revenueTotal)} · n/d`
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

const MEDALS = ["🥇", "🥈", "🥉"];

// Tick del nome venditore sull'asse Y: aggiunge la medaglia per i primi 3.
function SellerNameTick({ x, y, payload, index, dark }: any) {
  const medal = index < 3 ? MEDALS[index] : null;
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      className={cn("text-[13px] font-semibold", dark ? "fill-white" : "fill-slate-900")}
    >
      {medal ? `${medal} ` : ""}
      {payload.value}
    </text>
  );
}

function SellersRankedBarChart({
  rows,
  sellerTargets,
  dark
}: {
  rows: RankingRow[];
  sellerTargets: Record<string, number>;
  dark?: boolean;
}) {
  // Chi ha venduto di piu' sta in alto, chi ha venduto di meno in basso: i
  // primi 3 (in cima) vengono evidenziati con una medaglia.
  const chartData = buildSellerChartData(rows, sellerTargets);

  // La barra e' sempre proporzionale al fatturato assoluto, mai alla
  // percentuale sul target: un venditore a 10.000 ha una barra piu' lunga
  // di uno a 9.500, a prescindere dalla percentuale (mostrata solo nel testo).
  const maxRevenue = chartData.reduce((max, entry) => Math.max(max, entry.revenue), 0) || 1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        barCategoryGap="12%"
        margin={{ top: 4, right: 150, bottom: 4, left: 4 }}
      >
        <XAxis type="number" hide domain={[0, maxRevenue]} />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          axisLine={false}
          tickLine={false}
          tick={<SellerNameTick dark={dark} />}
        />
        <Bar
          dataKey="revenue"
          radius={[6, 6, 6, 6]}
          fill="#7C3AED"
          isAnimationActive={false}
          background={{ fill: dark ? "rgba(255,255,255,0.08)" : "#f8fafc", radius: 6 }}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.hasTarget ? (dark ? "#C4B5FD" : "#7C3AED") : dark ? "rgba(255,255,255,0.18)" : "#e2e8f0"}
            />
          ))}
          <LabelList
            dataKey="label"
            content={(props: any) => <BarValueLabel {...props} formatted={props.value} dark={dark} />}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function SellersAppointmentsBarChart({ rows }: { rows: RankingRow[] }) {
  const chartData = rows
    .map((row) => ({
      name: getSurname(row.seller),
      appointments: row.appointmentsBooked,
      label: `${formatCompactNumber(row.appointmentsBooked)} app.`
    }))
    .sort((a, b) => b.appointments - a.appointments);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        barCategoryGap="13%"
        margin={{ top: 4, right: 90, bottom: 4, left: 4 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fontWeight: 600, fill: "#334155" }}
        />
        <Bar dataKey="appointments" radius={[6, 6, 6, 6]} background={{ fill: "#f8fafc", radius: 6 }}>
          {chartData.map((_, index) => (
            <Cell key={index} fill="#7C3AED" />
          ))}
          <LabelList dataKey="label" content={(props: any) => <BarValueLabel {...props} formatted={props.value} />} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const PANEL_TONES = {
  white: { surface: SURFACE, iconBg: "bg-primary/10", iconColor: "text-primary", title: "text-slate-900" },
  tint: {
    surface: "bg-primary/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_28px_-18px_rgba(124,58,237,0.35)]",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
    title: "text-slate-900"
  },
  dark: {
    surface: "bg-[#150F26] shadow-[0_1px_2px_rgba(0,0,0,0.2),0_18px_36px_-16px_rgba(0,0,0,0.5)]",
    iconBg: "bg-white/10",
    iconColor: "text-white",
    title: "text-white"
  }
} as const;

function PanelCard({
  title,
  icon: Icon,
  tone = "white",
  children
}: {
  title: string;
  icon: typeof Users;
  tone?: keyof typeof PANEL_TONES;
  children: React.ReactNode;
}) {
  const palette = PANEL_TONES[tone];
  return (
    <div className={cn("flex h-full min-h-0 flex-col rounded-[1.1rem] p-5", palette.surface)}>
      <div className="mb-2 flex shrink-0 items-center gap-2.5">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-full", palette.iconBg)}>
          <Icon className={cn("h-3.5 w-3.5", palette.iconColor)} />
        </div>
        <p className={cn("text-[15px] font-semibold tracking-tight", palette.title)}>{title}</p>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

export function TvDashboard() {
  const now = useClock();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [teams, setTeams] = useState<TeamSalesOverviewRow[]>([]);
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [sellerTargets, setSellerTargets] = useState<Record<string, number>>({});
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const celebrationRef = useRef<SaleCelebrationHandle>(null);
  const previousRevenueRef = useRef<Map<string, number> | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const [dashboardResponse, teamsResponse, sellersResponse] = await Promise.all([
          fetch("/api/dashboard-data?preset=month&seller=all&details=lite", { cache: "no-store" }),
          fetch("/api/team-sales/overview", { cache: "no-store" }),
          fetch("/api/sellers", { cache: "no-store" })
        ]);

        if (!isActive) return;

        if (dashboardResponse.ok) {
          setData((await dashboardResponse.json()) as DashboardResponse);
        }
        if (teamsResponse.ok) {
          const payload = (await teamsResponse.json()) as { teams?: TeamSalesOverviewRow[] };
          const overviewTeams = payload.teams ?? [];
          setTeams(overviewTeams);

          // Il target lo tiene solo la scheda venditore dentro ogni squadra
          // Team Sales (la panoramica non lo espone per singolo venditore):
          // recuperiamo il dettaglio di ogni squadra per costruire la mappa
          // nome -> obiettivo individuale.
          const details = await Promise.all(
            overviewTeams.map((team) =>
              fetch(`/api/team-sales/${team.teamId}`, { cache: "no-store" })
                .then((response) => (response.ok ? response.json() : null))
                .catch(() => null)
            )
          );
          if (isActive) {
            const targets: Record<string, number> = {};
            details.forEach((detail) => {
              detail?.setup?.sellers?.forEach((seller: { name: string; target: number }) => {
                targets[seller.name] = (targets[seller.name] ?? 0) + Number(seller.target || 0);
              });
            });
            setSellerTargets(targets);
          }
        }
        if (sellersResponse.ok) {
          const payload = (await sellersResponse.json()) as { sellers?: SellerRecord[] };
          setSellers((payload.sellers ?? []).filter((seller) => seller.is_active));
        }
        setLastFetchedAt(new Date());
      } catch {
        // Schermo non presidiato: ignora un fallimento occasionale, riprova al giro successivo.
      }
    };

    void load();
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      isActive = false;
      clearInterval(id);
    };
  }, []);

  // La classifica KPI include solo chi ha almeno una riga registrata nel
  // mese corrente: qui la completiamo con tutti i venditori attivi (a 0
  // per chi non ha ancora inserito dati), cosi' la TV mostra sempre
  // l'intero organico e non solo chi ha gia' lavorato questo mese.
  const sortedRanking = useMemo(() => {
    if (!data) return [];
    const byName = new Map(data.ranking.map((row) => [row.seller, row]));

    const merged = sellers.map((seller): RankingRow => byName.get(seller.name) ?? ({ ...EMPTY_RANKING_ROW, seller: seller.name }));
    data.ranking.forEach((row) => {
      if (!sellers.some((seller) => seller.name === row.seller)) {
        merged.push(row);
      }
    });

    return merged.sort((a, b) => b.revenueTotal - a.revenueTotal);
  }, [data, sellers]);

  // Festeggia quando il fatturato di un venditore sale rispetto
  // all'ultimo giro (= ha appena inserito una vendita). Il primo
  // caricamento fa solo da base di confronto, senza festeggiare tutti.
  useEffect(() => {
    if (sortedRanking.length === 0) return;

    const nextRevenueByName = new Map(sortedRanking.map((row) => [row.seller, row.revenueTotal]));
    const previous = previousRevenueRef.current;

    if (previous) {
      sortedRanking.forEach((row) => {
        const before = previous.get(row.seller) ?? 0;
        const delta = row.revenueTotal - before;
        if (delta > 0) {
          celebrationRef.current?.celebrate(getSurname(row.seller), delta);
        }
      });
    }

    previousRevenueRef.current = nextRevenueByName;
  }, [sortedRanking]);

  const teamsSoldTotal = teams.reduce((sum, team) => sum + team.soldTotal, 0);
  const teamsTargetTotal = teams.reduce((sum, team) => sum + team.targetTotal, 0);
  const teamsTargetPercent = teamsTargetTotal > 0 ? (teamsSoldTotal / teamsTargetTotal) * 100 : 0;

  if (!data) {
    return (
      <main className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-violet-50">
        <div className="flex items-center gap-3 text-slate-500">
          <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
          <span>Caricamento risultati…</span>
        </div>
      </main>
    );
  }

  const lastUpdatedLabel = lastFetchedAt ? format(lastFetchedAt, "HH:mm", { locale: it }) : "--:--";
  const revenueDelta = computeDelta(data.comparison.current.revenueTotal, data.comparison.previous.revenueTotal);
  const dealsDelta = computeDelta(data.comparison.current.dealsClosedTotal, data.comparison.previous.dealsClosedTotal);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#EEECF6] p-5">
      <SaleCelebration ref={celebrationRef} />
      <div
        className={cn(
          "mx-auto flex h-full max-w-[1900px] flex-col rounded-[1.75rem] p-7",
          "bg-white shadow-[0_1px_1px_rgba(15,23,42,0.03),0_32px_64px_-24px_rgba(88,28,135,0.16)]"
        )}
      >
        <div className="flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#5b21b6] text-white shadow-[0_8px_16px_-6px_rgba(124,58,237,0.55)]">
              <LayoutGrid className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="font-display text-[17px] font-semibold tracking-tight text-slate-950">Cold Sales</p>
              <p className="text-[11px] text-slate-400">Risultati live</p>
            </div>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Andamento del mese
          </h1>
          <div className="flex items-center gap-2 rounded-full bg-slate-950/[0.04] px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-slate-600">Aggiornato alle {lastUpdatedLabel}</span>
            <span className="text-xs text-slate-400 capitalize">
              {now.toLocaleDateString("it-IT", { day: "numeric", month: "long" })}
            </span>
          </div>
        </div>

        <div className="mt-4 grid shrink-0 grid-cols-4 gap-4">
          <HeroStatCard
            label="Fatturato totale"
            value={formatCurrency(data.summary.revenueTotal)}
            delta={revenueDelta}
            description="vs mese scorso"
          />
          <StatCard
            label="Trattative chiuse"
            value={formatCompactNumber(data.summary.dealsClosedTotal)}
            delta={dealsDelta}
            description="vs mese scorso"
            icon={Trophy}
            tint="violet"
          />
          <HalfCircleGaugeStatCard
            label="Obiettivo totale"
            percent={teamsTargetPercent}
            description={`${formatTeamCurrency(teamsSoldTotal)} su ${formatTeamCurrency(teamsTargetTotal)}`}
          />
          <StatCard
            label="Appuntamenti presi"
            value={formatCompactNumber(data.summary.appointmentsBooked)}
            description="totale del team, questo mese"
            icon={Target}
            tint="gray"
          />
        </div>

        <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 gap-4">
          <div className="flex min-h-0 flex-col gap-4">
            <div className="min-h-0 flex-1">
              <PanelCard title="Andamento squadre" icon={Users}>
                {teams.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Nessuna squadra configurata.
                  </div>
                ) : (
                  <TeamsBarChart teams={teams} />
                )}
              </PanelCard>
            </div>
            <div className="min-h-0 flex-1">
              <PanelCard title="Appuntamenti presi" icon={Target}>
                {sortedRanking.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Nessun dato disponibile.
                  </div>
                ) : (
                  <SellersAppointmentsBarChart rows={sortedRanking} />
                )}
              </PanelCard>
            </div>
          </div>
          <PanelCard title="Classifica venditori" icon={Trophy}>
            {sortedRanking.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Nessun dato disponibile.
              </div>
            ) : (
              <SellersRankedBarChart rows={sortedRanking} sellerTargets={sellerTargets} />
            )}
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
