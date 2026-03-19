import { getAllGoogleSheetsRows } from "@/lib/google-sheets";
import { resolveDateRange, resolvePreviousDateRange } from "@/lib/data/filters";
import { buildSellerRanking, buildTrendSeries, calculateSummaryMetrics } from "@/lib/kpi";
import { DashboardFilters, DashboardResponse, NormalizedSalesRow } from "@/lib/types";

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
  const { rows: normalizedRows, source } = await getAllGoogleSheetsRows();
  const currentRange = resolveDateRange(filters);
  const previousRange = resolvePreviousDateRange(filters);
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
        revenue: currentSummary.revenue,
        dealsClosed: currentSummary.dealsClosed,
        closingRate: currentSummary.closingRate
      },
      previous: {
        revenue: previousSummary.revenue,
        dealsClosed: previousSummary.dealsClosed,
        closingRate: previousSummary.closingRate
      }
    },
    meta: {
      lastUpdated: new Date().toISOString(),
      source,
      availableSellers: [...new Set(normalizedRows.map((row) => row.seller))].sort(),
      totalRows: filteredRows.length
    }
  };
}
