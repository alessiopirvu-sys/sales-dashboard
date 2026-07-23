import { NextRequest, NextResponse } from "next/server";
import { addMonths, getYear, startOfMonth } from "date-fns";

import { parseFiltersFromSearchParams, resolveDateRange, resolvePreviousDateRange } from "@/lib/data/filters";
import { isValidGoogleSheetsCsvUrl } from "@/lib/google-sheets-url";
import {
  aggregateSalesRowsByPeriod,
  buildSellerDailySeries,
  buildSellerRanking,
  buildTrendSeries,
  calculateSalesKpis,
  calculateSummaryMetrics
} from "@/lib/kpi";
import { getSellerSheetEntries } from "@/lib/seller-sheets";
import { fetchAndParseSellerSheet } from "@/lib/sheets-csv";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  DashboardFilters,
  NormalizedSalesRow,
  SellerDashboardBreakdown,
  SellerRecord,
  SellerSheetDebug
} from "@/lib/types";

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

async function insertSyncLog(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  sellerId: string,
  status: "success" | "error",
  message: string
) {
  try {
    await Promise.race([
      supabase.from("sheet_sync_logs").insert({
        seller_id: sellerId,
        status,
        message
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout log sync")), 3000)
      )
    ]);
  } catch {
    // Non bloccare la dashboard se il log di sync fallisce o risponde lentamente.
  }
}

function logSyncError(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  sellerId: string,
  message: string
) {
  void insertSyncLog(supabase, sellerId, "error", message);
}

type SellerSheetSource = {
  label: string;
  url: string;
  forcedMonth?: number;
};

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getRequiredMonthKeys(
  currentRange: { startDate: string; endDate: string },
  previousRange: { startDate: string; endDate: string }
) {
  const required = new Set<string>();
  let cursor = startOfMonth(new Date(previousRange.startDate));
  const limit = startOfMonth(new Date(currentRange.endDate));

  while (cursor <= limit) {
    required.add(toMonthKey(cursor));
    cursor = addMonths(cursor, 1);
  }

  return required;
}

function getSellerSheetSources(
  seller: SellerRecord,
  requiredMonthKeys: Set<string>
): SellerSheetSource[] {
  return getSellerSheetEntries(seller)
    .filter((entry) => requiredMonthKeys.has(entry.key))
    .map((entry) => ({
      label: entry.label,
      url: entry.url,
      forcedMonth: entry.month
    }));
}

export async function GET(request: NextRequest) {
  try {
    const shouldBypassCache = request.nextUrl.searchParams.has("cacheBust");
    const responseDetails =
      request.nextUrl.searchParams.get("details") === "lite" ? "lite" : "full";
    const filters = parseFiltersFromSearchParams(request.nextUrl.searchParams);
    const supabase = getSupabaseAdmin();

    const { data: sellers, error: sellersError } = await supabase
      .from("sellers")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (sellersError) {
      throw sellersError;
    }

    const activeSellers = (sellers ?? []) as SellerRecord[];
    const currentRange = resolveDateRange(filters);
    const previousRange = resolvePreviousDateRange(filters);
    const requiredMonthKeys = getRequiredMonthKeys(currentRange, previousRange);
    const referenceYear = getYear(new Date(currentRange.endDate));
    const parserDebug: SellerSheetDebug[] = [];

    const settledRows = await Promise.allSettled(
      activeSellers.map(async (seller) => {
        const sources = getSellerSheetSources(seller, requiredMonthKeys);
        if (sources.length === 0) {
          return [];
        }

        const parsedSources = await Promise.allSettled(
          sources.map(async (source) => {
            if (!isValidGoogleSheetsCsvUrl(source.url)) {
              logSyncError(
                supabase,
                seller.id,
                `Invalid Google Sheets CSV URL (${source.label})`
              );
              return null;
            }

            const parsed = await fetchAndParseSellerSheet(
              seller,
              {
                sheetUrl: source.url,
                sourceLabel: source.label,
                forcedMonth: source.forcedMonth,
                bypassCache: shouldBypassCache
              },
              referenceYear
            );

            return parsed;
          })
        );

        const sellerRows: NormalizedSalesRow[] = [];

        for (let index = 0; index < parsedSources.length; index += 1) {
          const result = parsedSources[index];
          const source = sources[index];

          if (result.status === "fulfilled" && result.value) {
            const parsed = result.value;
            parserDebug.push(parsed.debug);
            sellerRows.push(...parsed.rows);
            continue;
          }

          const reason =
            result.status === "rejected"
              ? result.reason
              : new Error("Errore sconosciuto durante il fetch del foglio.");
          const message =
            reason instanceof Error
              ? `${source.label}: ${reason.message}`
              : `${source.label}: errore sconosciuto durante il fetch del foglio.`;
          logSyncError(supabase, seller.id, message);
        }

        return sellerRows;
      })
    );

    const allRows = settledRows.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );
    const currentRows = filterRowsByRange(allRows, filters, currentRange);
    const previousRows = filterRowsByRange(allRows, filters, previousRange);

    const summary = calculateSummaryMetrics(currentRows);
    const currentAggregated = aggregateSalesRowsByPeriod(currentRows);
    const previousSummary = calculateSummaryMetrics(previousRows);
    const channelKpis = calculateSalesKpis(currentAggregated);

    const sellerBreakdown: SellerDashboardBreakdown[] | undefined =
      responseDetails === "full"
        ? [...new Set(currentRows.map((row) => row.seller))]
            .map((seller) => {
              const sellerRows = currentRows.filter((row) => row.seller === seller);
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

    const firstDebug = responseDetails === "full" ? parserDebug[0] : undefined;

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
            sellerDailyTrend: buildSellerDailySeries(currentRows),
            detectedHeaderRowIndex: firstDebug?.detectedHeaderRowIndex ?? -1,
            detectedHeaders: firstDebug?.detectedHeaders ?? [],
            parsedRowCount: firstDebug?.parsedRowCount ?? 0,
            validRowCount: firstDebug?.validRowCount ?? 0,
            firstTwoNormalizedRows: firstDebug?.firstTwoNormalizedRows ?? [],
            parserDebug
          }
        : {}),
      meta: {
        lastUpdated: new Date().toISOString(),
        source: "csv_public",
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
