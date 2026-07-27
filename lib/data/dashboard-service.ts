import { resolveDateRange, resolvePreviousDateRange } from "@/lib/data/filters";
import { loadDashboardRows } from "@/lib/internal-kpi/repository";
import { buildSellerRanking, buildTrendSeries, calculateSummaryMetrics } from "@/lib/kpi";
import { DashboardFilters, DashboardResponse, NormalizedSalesRow } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function filterRowsByRange(
  rows: NormalizedSalesRow[],
  filters: DashboardFilters,
  dateRange: { startDate: string; endDate: string }
) {
  return rows.filter((row) => {
    const matchesSeller = filters.seller === "all" || row.seller === filters.seller;
    const matchesStart = row.date >= dateRange.startDate;
    const matchesEnd = row.date <= dateRange.endDate;

    return matchesSeller && matchesStart && matchesEnd;
  });
}

export async function getDashboardData(filters: DashboardFilters): Promise<DashboardResponse> {
  const currentRange = resolveDateRange(filters);
  const previousRange = resolvePreviousDateRange(filters);
  const supabase = getSupabaseAdmin();
  const { data: sellers, error } = await supabase
    .from("sellers")
    .select("id,name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  const sellerNamesById = new Map(
    ((sellers ?? []) as Array<{ id: string; name: string }>).map((seller) => [seller.id, seller.name])
  );
  const normalizedRows = await loadDashboardRows(supabase, {
    startDate: previousRange.startDate,
    endDate: currentRange.endDate,
    sellerIds: Array.from(sellerNamesById.keys()),
    sellerNamesById
  });
  const filteredRows = filterRowsByRange(normalizedRows, filters, currentRange);
  const previousRows = filterRowsByRange(normalizedRows, filters, previousRange);
  const currentSummary = calculateSummaryMetrics(filteredRows);
  const previousSummary = calculateSummaryMetrics(previousRows);

  return {
    summary: currentSummary,
    ranking: buildSellerRanking(filteredRows),
    trend: buildTrendSeries(filteredRows),
    comparison: {
      current: {
        revenueTotal: currentSummary.revenueTotal,
        dealsClosedTotal: currentSummary.dealsClosedTotal,
        closingRate: currentSummary.closingRate
      },
      previous: {
        revenueTotal: previousSummary.revenueTotal,
        dealsClosedTotal: previousSummary.dealsClosedTotal,
        closingRate: previousSummary.closingRate
      }
    },
    meta: {
      lastUpdated: new Date().toISOString(),
      source: "internal_supabase",
      availableSellers: Array.from(sellerNamesById.values()),
      totalRows: filteredRows.length
    }
  };
}
