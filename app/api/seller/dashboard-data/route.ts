import { NextRequest, NextResponse } from "next/server";

import { requireSeller } from "@/lib/auth/session";
import { parseFiltersFromSearchParams, resolveDateRange, resolvePreviousDateRange } from "@/lib/data/filters";
import {
  aggregateSalesRowsByPeriod,
  buildSellerRanking,
  buildTrendSeries,
  calculateSalesKpis,
  calculateSummaryMetrics
} from "@/lib/kpi";
import { loadDashboardRows } from "@/lib/internal-kpi/repository";
import { DashboardFilters, NormalizedSalesRow } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function filterRowsByRange(
  rows: NormalizedSalesRow[],
  filters: DashboardFilters,
  range: { startDate: string; endDate: string }
) {
  return rows.filter((row) => {
    const matchesSeller = row.seller === filters.seller;
    const matchesStart = row.date >= range.startDate;
    const matchesEnd = row.date <= range.endDate;
    return matchesSeller && matchesStart && matchesEnd;
  });
}

export async function GET(request: NextRequest) {
  try {
    const context = await requireSeller();
    const filters = parseFiltersFromSearchParams(request.nextUrl.searchParams);
    const sellerName = context.seller.name;
    const lockedFilters: DashboardFilters = {
      ...filters,
      seller: sellerName
    };

    const currentRange = resolveDateRange(lockedFilters);
    const previousRange = resolvePreviousDateRange(lockedFilters);
    const allRows = await loadDashboardRows(getSupabaseAdmin(), {
      startDate: previousRange.startDate,
      endDate: currentRange.endDate,
      sellerIds: [context.seller.id],
      sellerNamesById: new Map([[context.seller.id, sellerName]])
    });

    const currentRows = filterRowsByRange(allRows, lockedFilters, currentRange);
    const previousRows = filterRowsByRange(allRows, lockedFilters, previousRange);
    const summary = calculateSummaryMetrics(currentRows);
    const currentAggregated = aggregateSalesRowsByPeriod(currentRows);
    const previousSummary = calculateSummaryMetrics(previousRows);
    const channelKpis = calculateSalesKpis(currentAggregated);

    return NextResponse.json({
      summary,
      ranking: buildSellerRanking(currentRows),
      trend: buildTrendSeries(currentRows),
      comparison: {
        current: {
          revenueTotal: summary.revenueTotal,
          dealsClosedTotal: summary.dealsClosedTotal,
          closingRate: summary.closingRate
        },
        previous: {
          revenueTotal: previousSummary.revenueTotal,
          dealsClosedTotal: previousSummary.dealsClosedTotal,
          closingRate: previousSummary.closingRate
        }
      },
      channelKpis,
      meta: {
        lastUpdated: new Date().toISOString(),
        source: "internal_supabase",
        availableSellers: [sellerName],
        totalRows: currentRows.length
      }
    });
  } catch (error) {
    console.error("Errore dashboard seller:", error);
    return NextResponse.json(
      {
        error: "DASHBOARD_DATA_ERROR",
        message: error instanceof Error ? error.message : "Errore durante il caricamento KPI."
      },
      { status: 500 }
    );
  }
}
