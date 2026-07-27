import { NextRequest, NextResponse } from "next/server";

import { parseFiltersFromSearchParams, resolveDateRange, resolvePreviousDateRange } from "@/lib/data/filters";
import {
  aggregateSalesRowsByPeriod,
  buildSellerDailySeries,
  buildSellerRanking,
  buildTrendSeries,
  calculateSalesKpis,
  calculateSummaryMetrics
} from "@/lib/kpi";
import { loadDashboardRows } from "@/lib/internal-kpi/repository";
import {
  DashboardFilters,
  NormalizedSalesRow,
  SellerDashboardBreakdown,
  SellerRecord
} from "@/lib/types";
import { requireAdmin } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function filterRowsByRange(
  rows: NormalizedSalesRow[],
  filters: DashboardFilters,
  range: { startDate: string; endDate: string }
) {
  return rows.filter((row) => {
    const matchesSeller = filters.seller === "all" || row.seller === filters.seller;
    const matchesStart = row.date >= range.startDate;
    const matchesEnd = row.date <= range.endDate;
    return matchesSeller && matchesStart && matchesEnd;
  });
}

function groupRowsBySeller(rows: NormalizedSalesRow[]) {
  return rows.reduce<Map<string, NormalizedSalesRow[]>>((accumulator, row) => {
    const sellerRows = accumulator.get(row.seller);

    if (sellerRows) {
      sellerRows.push(row);
    } else {
      accumulator.set(row.seller, [row]);
    }

    return accumulator;
  }, new Map());
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const responseDetails =
      request.nextUrl.searchParams.get("details") === "lite" ? "lite" : "full";
    const filters = parseFiltersFromSearchParams(request.nextUrl.searchParams);
    const supabase = getSupabaseAdmin();

    const { data: sellers, error: sellersError } = await supabase
      .from("sellers")
      .select("id,name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (sellersError) {
      throw sellersError;
    }

    const activeSellers = (sellers ?? []) as SellerRecord[];
    const sellerNamesById = new Map(activeSellers.map((seller) => [seller.id, seller.name]));
    const currentRange = resolveDateRange(filters);
    const previousRange = resolvePreviousDateRange(filters);
    const allRows: NormalizedSalesRow[] = await loadDashboardRows(supabase, {
      startDate: previousRange.startDate,
      endDate: currentRange.endDate,
      sellerIds: activeSellers.map((seller) => seller.id),
      sellerNamesById
    });
    const currentRows = filterRowsByRange(allRows, filters, currentRange);
    const previousRows = filterRowsByRange(allRows, filters, previousRange);

    const summary = calculateSummaryMetrics(currentRows);
    const currentAggregated = aggregateSalesRowsByPeriod(currentRows);
    const previousSummary = calculateSummaryMetrics(previousRows);
    const channelKpis = calculateSalesKpis(currentAggregated);

    const sellerBreakdown: SellerDashboardBreakdown[] | undefined =
      responseDetails === "full"
        ? Array.from(groupRowsBySeller(currentRows).entries())
            .map(([seller, sellerRows]) => {
              const aggregated = aggregateSalesRowsByPeriod(sellerRows);
              return {
                seller,
                summary: calculateSummaryMetrics(sellerRows),
                aggregated,
                kpis: calculateSalesKpis(aggregated)
              };
            })
            .sort((left, right) => right.summary.revenueTotal - left.summary.revenueTotal)
        : undefined;

    const payload = {
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
      ...(responseDetails === "full"
        ? {
            sellerBreakdown,
            sellerDailyTrend: buildSellerDailySeries(currentRows)
          }
        : {}),
      meta: {
        lastUpdated: new Date().toISOString(),
        source: "internal_supabase",
        availableSellers: activeSellers.map((seller) => seller.name),
        totalRows: currentRows.length
      }
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Errore durante il caricamento live della dashboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
