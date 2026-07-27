"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { LoaderCircle, TrendingUp, UserRound } from "lucide-react";

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
import { TrendChartCard } from "@/components/dashboard/trend-chart-card";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardFilters, DashboardResponse } from "@/lib/types";

const initialFilters: DashboardFilters = {
  preset: "month",
  seller: ""
};

type SellerDashboardPageProps = {
  sellerName: string;
};

export function SellerDashboardPage({ sellerName }: SellerDashboardPageProps) {
  const [filters, setFilters] = useState<DashboardFilters>({
    ...initialFilters,
    seller: sellerName
  });
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRankingMetric, setActiveRankingMetric] = useState<RankingMetricKey>("revenueTotal");
  const leaderboardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setFilters((current) => ({ ...current, seller: sellerName }));
  }, [sellerName]);

  const fetchData = async (nextFilters: DashboardFilters, refresh = false) => {
    setError(null);
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params = new URLSearchParams({
        preset: nextFilters.preset,
        seller: sellerName,
        details: "lite"
      });

      if (nextFilters.startDate) {
        params.set("startDate", nextFilters.startDate);
      }

      if (nextFilters.endDate) {
        params.set("endDate", nextFilters.endDate);
      }

      if (refresh) {
        params.set("cacheBust", String(Date.now()));
      }

      const response = await fetch(`/api/seller/dashboard-data?${params.toString()}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Impossibile caricare i KPI del venditore.");
      }

      const payload = (await response.json()) as DashboardResponse;
      setData(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Errore sconosciuto durante il caricamento."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData(filters);
  }, [filters]);

  const sellerOptions = useMemo(
    () => [{ label: sellerName, value: sellerName }],
    [sellerName]
  );

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

  return (
    <main className="mx-auto max-w-[1480px] space-y-6">
      <AppHeader
        title="Area venditore"
        subtitle="Le tue metriche"
        lastUpdatedLabel={lastUpdatedLabel}
      />

      <FilterBar
        filters={filters}
        sellerOptions={sellerOptions}
        onChange={(nextFilters) => setFilters({ ...nextFilters, seller: sellerName })}
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
              <span>Caricamento KPI personali…</span>
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
              <PodiumCard ranking={sortedRanking} activeMetric={activeRankingMetric} />
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
                    Profilo venditore
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-950">{sellerName}</p>
                      <p className="text-sm text-slate-500">Dashboard personale filtrata sul tuo account</p>
                    </div>
                  </div>
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
