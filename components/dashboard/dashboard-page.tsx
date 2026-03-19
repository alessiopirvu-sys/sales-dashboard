"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { AddSellerModal } from "@/components/sellers/AddSellerModal";
import { SellersList } from "@/components/sellers/SellersList";
import { buildDashboardUrl } from "@/lib/data/filters";
import { DashboardFilters, DashboardResponse, SellerRecord } from "@/lib/types";

const initialFilters: DashboardFilters = {
  preset: "month",
  seller: "all"
};

export function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<SellerRecord | null>(null);
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [isLoadingSellers, setIsLoadingSellers] = useState(false);
  const [activeRankingMetric, setActiveRankingMetric] = useState<RankingMetricKey>("revenue");
  const [venditoriCardHeight, setVenditoriCardHeight] = useState<number | undefined>(undefined);
  const leaderboardRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async (nextFilters: DashboardFilters, refresh = false) => {
    setError(null);
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch(buildDashboardUrl(nextFilters), { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Impossibile caricare i dati della dashboard.");
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

  const handleDeleteSeller = async (seller: SellerRecord) => {
    try {
      const response = await fetch(`/api/sellers/${seller.id}`, {
        method: "DELETE"
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossibile eliminare il venditore.");
      }

      await loadSellers();
      await fetchData(filters, true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Errore sconosciuto durante l'eliminazione venditore."
      );
    }
  };

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

      if (right.revenue !== left.revenue) {
        return right.revenue - left.revenue;
      }

      return right.dealsClosed - left.dealsClosed;
    });
  }, [activeRankingMetric, data]);

  useLayoutEffect(() => {
    const element = leaderboardRef.current;
    if (!element) {
      return;
    }

    const updateHeight = () => {
      const shouldSync = window.innerWidth >= 1280;
      const nextHeight = shouldSync ? Math.round(element.getBoundingClientRect().height) : undefined;
      setVenditoriCardHeight(nextHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [sortedRanking.length, sellers.length, activeRankingMetric]);

  const handleRefresh = () => void fetchData(filters, true);
  const handleExport = () => {};

  return (
    <main className="min-h-screen bg-transparent px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1480px]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/85 bg-white/76 p-3 shadow-float backdrop-blur-xl sm:rounded-[2.4rem] sm:p-4 md:rounded-[2.8rem] md:p-6">
          <div className="pointer-events-none absolute inset-0 bg-hero opacity-95" />
          <div className="relative z-10 space-y-4">
            <TopNavbar />

            <AppHeader
              title="Sales KPI Dashboard"
              subtitle="Dashboard"
              lastUpdatedLabel={lastUpdatedLabel}
              onExport={handleExport}
              onAddSeller={() => {
                setEditingSeller(null);
                setIsSellerModalOpen(true);
              }}
            />

            <FilterBar
              filters={filters}
              sellerOptions={sellerOptions}
              onChange={setFilters}
              onRefresh={() => void fetchData(filters, true)}
              isRefreshing={isRefreshing}
            />

            {error ? (
              <Card className="border-rose-100 bg-rose-50/88">
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
              <div className="space-y-5">
                <div className="grid gap-5 xl:grid-cols-12">
                  <div className="xl:col-span-5">
                    <TrendChartCard trend={data.trend} />
                  </div>
                  <div className="xl:col-span-3">
                    <InsightCard
                      revenue={periodComparison?.current.revenue ?? 0}
                      previousRevenue={periodComparison?.previous.revenue ?? 0}
                      dealsClosed={periodComparison?.current.dealsClosed ?? 0}
                      previousDealsClosed={periodComparison?.previous.dealsClosed ?? 0}
                      closingRate={periodComparison?.current.closingRate ?? 0}
                      previousClosingRate={periodComparison?.previous.closingRate ?? 0}
                    />
                  </div>
                  <div className="xl:col-span-4">
                    <PodiumCard ranking={sortedRanking.slice(0, 8)} activeMetric={activeRankingMetric} />
                  </div>

                  <div className="xl:col-span-8">
                    <KpiGrid summary={data.summary} />
                  </div>
                  <div className="xl:col-span-4">
                    <ProgressCard
                      showUpRate={data.summary.showUpRate}
                      closingRate={data.summary.closingRate}
                      appointmentsDone={data.summary.appointmentsDone}
                      dealsClosed={data.summary.dealsClosed}
                    />
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-12 xl:items-stretch">
                  <div className="min-w-0 xl:col-span-8">
                    <LeaderboardTable
                      ref={leaderboardRef}
                      rows={sortedRanking}
                      activeMetric={activeRankingMetric}
                      onMetricChange={setActiveRankingMetric}
                    />
                  </div>
                  <div className="h-full min-h-0 overflow-hidden xl:col-span-4">
                    <div
                      className="surface-card flex flex-col overflow-hidden rounded-[2.2rem]"
                      style={venditoriCardHeight ? { height: `${venditoriCardHeight}px` } : undefined}
                    >
                      <SellersList
                        sellers={sellers}
                        isLoading={isLoadingSellers}
                        onEdit={(seller) => {
                          setEditingSeller(seller);
                          setIsSellerModalOpen(true);
                        }}
                        onDelete={(seller) => void handleDeleteSeller(seller)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <AddSellerModal
        open={isSellerModalOpen}
        onClose={() => {
          setIsSellerModalOpen(false);
          setEditingSeller(null);
        }}
        onSaved={async () => {
          await loadSellers();
          await fetchData(filters, true);
        }}
        seller={editingSeller}
      />
    </main>
  );
}
