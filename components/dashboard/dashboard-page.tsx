"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { LoaderCircle, TrendingUp } from "lucide-react";

import { AppHeader } from "@/components/dashboard/app-header";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { InsightCard } from "@/components/dashboard/insight-card";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { LeaderboardTable } from "@/components/dashboard/leaderboard-table";
import { PodiumCard } from "@/components/dashboard/podium-card";
import { ProgressCard } from "@/components/dashboard/progress-card";
import {
  getRankingMetricConfig,
  RankingMetricKey
} from "@/components/dashboard/ranking-metrics";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { TrendChartCard } from "@/components/dashboard/trend-chart-card";
import { Card, CardContent } from "@/components/ui/card";
import { buildDashboardUrlWithOptions } from "@/lib/data/filters";
import { DashboardFilters, DashboardResponse, SellerRecord } from "@/lib/types";

const initialFilters: DashboardFilters = {
  preset: "month",
  seller: "all"
};
const DASHBOARD_FETCH_TIMEOUT_MS = 60000;
const DASHBOARD_FETCH_RETRIES = 2;

export function DashboardPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [isLoadingSellers, setIsLoadingSellers] = useState(false);
  const [activeRankingMetric, setActiveRankingMetric] = useState<RankingMetricKey>("revenueTotal");
  const leaderboardRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);

  const fetchData = async (nextFilters: DashboardFilters, refresh = false) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setError(null);
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      let response: Response | null = null;
      let lastError: Error | null = null;
      const shouldUseTimeout = refresh || Boolean(data);

      for (let attempt = 0; attempt < DASHBOARD_FETCH_RETRIES; attempt += 1) {
        const controller = new AbortController();
        const timeoutId = shouldUseTimeout
          ? setTimeout(() => controller.abort(), DASHBOARD_FETCH_TIMEOUT_MS)
          : null;

        try {
          response = await fetch(
            buildDashboardUrlWithOptions(
              nextFilters,
              refresh
                ? { cacheBust: String(Date.now()), details: "lite" }
                : { details: "lite" }
            ),
            {
              cache: "no-store",
              signal: controller.signal
            }
          );
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          break;
        } catch (error) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          lastError =
            error instanceof Error ? error : new Error("Errore sconosciuto durante il caricamento.");

          if (attempt < DASHBOARD_FETCH_RETRIES - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          }
        }
      }

      if (!response) {
        throw lastError ?? new Error("Impossibile caricare i dati della dashboard.");
      }

      if (!response.ok) {
        throw new Error("Impossibile caricare i dati della dashboard.");
      }

      const payload = (await response.json()) as DashboardResponse;
      if (requestIdRef.current === requestId) {
        setData(payload);
      }
    } catch (requestError) {
      if (requestIdRef.current === requestId) {
        setError(
          requestError instanceof Error && requestError.name === "AbortError"
            ? "Il primo caricamento sta impiegando piu tempo del previsto. Riprova tra pochi secondi o usa Refresh."
            : requestError instanceof Error
              ? requestError.message
              : "Errore sconosciuto durante il caricamento."
        );
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    void fetchData(filters);
  }, [filters]);

  const loadSellers = async () => {
    setIsLoadingSellers(true);
    try {
      const response = await fetch("/api/sellers", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Impossibile caricare i venditori.");
      }

      const payload = (await response.json()) as { sellers: SellerRecord[]; error?: string };
      setSellers(payload.sellers ?? []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Errore sconosciuto durante il caricamento venditori."
      );
    } finally {
      setIsLoadingSellers(false);
    }
  };

  useEffect(() => {
    void loadSellers();
  }, []);

  const sellerOptions = useMemo(() => {
    if (!data) {
      return [{ label: "Tutti i venditori", value: "all" }];
    }

    return [
      { label: "Tutti i venditori", value: "all" },
      ...data.meta.availableSellers.map((seller) => ({ label: seller, value: seller }))
    ];
  }, [data]);

  const lastUpdatedLabel = data?.meta.lastUpdated
    ? format(new Date(data.meta.lastUpdated), "dd MMM yyyy, HH:mm", { locale: it })
    : "In attesa di sincronizzazione";
  const periodComparison = useMemo(() => data?.comparison, [data]);
  const sortedRanking = useMemo(() => {
    if (!data) {
      return [];
    }

    const metric = getRankingMetricConfig(activeRankingMetric);

    return [...data.ranking].sort((left, right) => {
      const delta = metric.getValue(right) - metric.getValue(left);
      if (delta !== 0) {
        return delta;
      }

      if (right.revenueTotal !== left.revenueTotal) {
        return right.revenueTotal - left.revenueTotal;
      }

      return right.dealsClosedTotal - left.dealsClosedTotal;
    });
  }, [activeRankingMetric, data]);

  const handleRefresh = () => void fetchData(filters, true);
  const handleExport = () => router.push("/esportazioni");

  return (
    <main className="mx-auto max-w-[1480px] space-y-6">
      <AppHeader
        title="Dashboard"
        subtitle="Sales KPI Dashboard"
        lastUpdatedLabel={lastUpdatedLabel}
        onExport={handleExport}
      />

      <FilterBar
        filters={filters}
        sellerOptions={sellerOptions}
        onChange={setFilters}
        onRefresh={() => void fetchData(filters, true)}
        isRefreshing={isRefreshing}
      />

      {error ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="flex items-center gap-3 p-6 text-rose-700">
            <TrendingUp className="h-5 w-5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading && !data ? (
        <Card>
          <CardContent className="flex min-h-[320px] items-center justify-center p-6">
            <div className="flex items-center gap-3 text-slate-500">
              <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
              <span>Sincronizzazione KPI…</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {data ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <TrendChartCard trend={data.trend} />
            </div>
            <div className="xl:col-span-3">
              <InsightCard
                revenueTotal={periodComparison?.current.revenueTotal ?? 0}
                previousRevenueTotal={periodComparison?.previous.revenueTotal ?? 0}
                dealsClosedTotal={periodComparison?.current.dealsClosedTotal ?? 0}
                previousDealsClosedTotal={periodComparison?.previous.dealsClosedTotal ?? 0}
                closingRate={periodComparison?.current.closingRate ?? 0}
                previousClosingRate={periodComparison?.previous.closingRate ?? 0}
              />
            </div>
            <div className="xl:col-span-3">
              <PodiumCard ranking={sortedRanking.slice(0, 8)} activeMetric={activeRankingMetric} />
            </div>

            <div className="xl:col-span-9">
              <KpiGrid summary={data.summary} />
            </div>
            <div className="space-y-6 xl:col-span-3">
              <ProgressCard
                showUpRate={data.summary.showUpRate}
                closingRate={data.summary.closingRate}
                appointmentsDone={data.summary.appointmentsDone}
                dealsClosed={data.summary.dealsClosed}
              />
              <Card>
                <CardContent className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Venditori attivi
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">
                    {isLoadingSellers ? "..." : sellers.length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    La gestione completa dei venditori ora e separata nella pagina dedicata.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <LeaderboardTable
            ref={leaderboardRef}
            rows={sortedRanking}
            activeMetric={activeRankingMetric}
            onMetricChange={setActiveRankingMetric}
          />
        </div>
      ) : null}
    </main>
  );
}
