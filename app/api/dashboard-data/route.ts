import { NextRequest, NextResponse } from "next/server";
import { getYear } from "date-fns";

import { parseFiltersFromSearchParams, resolveDateRange, resolvePreviousDateRange } from "@/lib/data/filters";
import { isValidGoogleSheetsCsvUrl } from "@/lib/google-sheets-url";
import { aggregateSalesRowsByPeriod, buildSellerRanking, buildTrendSeries, calculateSalesKpis, calculateSummaryMetrics } from "@/lib/kpi";
import { fetchAndParseSellerSheet } from "@/lib/sheets-csv";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  DashboardFilters,
  NormalizedSalesRow,
  SellerDashboardBreakdown,
  SellerRecord,
  SellerSheetDebug
} from "@/lib/types";

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
  await supabase.from("sheet_sync_logs").insert({
    seller_id: sellerId,
    status,
    message
  });
}

function getSellerSheetSources(seller: SellerRecord) {
  return [
    { label: "Principale", url: seller.sheet_url },
    ...(seller.sheet_url_april ? [{ label: "Aprile", url: seller.sheet_url_april }] : [])
  ];
}

export async function GET(request: NextRequest) {
  try {
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
    const referenceYear = getYear(new Date(currentRange.endDate));
    const parserDebug: SellerSheetDebug[] = [];

    const settledRows = await Promise.allSettled(
      activeSellers.map(async (seller) => {
        try {
          const sources = getSellerSheetSources(seller);
          const sellerRows: NormalizedSalesRow[] = [];

          for (const source of sources) {
            if (!isValidGoogleSheetsCsvUrl(source.url)) {
              await insertSyncLog(
                supabase,
                seller.id,
                "error",
                `Invalid Google Sheets CSV URL (${source.label})`
              );
              continue;
            }

            const parsed = await fetchAndParseSellerSheet(
              seller,
              {
                sheetUrl: source.url,
                sourceLabel: source.label
              },
              referenceYear
            );
            parserDebug.push(parsed.debug);
            sellerRows.push(...parsed.rows);
            console.log("[dashboard-data] detected header row", {
              seller: seller.name,
              sourceLabel: parsed.debug.sourceLabel,
              detectedHeaderRowIndex: parsed.debug.detectedHeaderRowIndex
            });
            console.log("[dashboard-data] mapped columns found", {
              seller: seller.name,
              sourceLabel: parsed.debug.sourceLabel,
              detectedHeaders: parsed.debug.detectedHeaders
            });
            console.log("[dashboard-data] rows parsed", {
              seller: seller.name,
              sourceLabel: parsed.debug.sourceLabel,
              parsedRowCount: parsed.debug.parsedRowCount,
              validRowCount: parsed.debug.validRowCount,
              skippedRowCount: parsed.debug.skippedRowCount
            });
          }

          await insertSyncLog(supabase, seller.id, "success", "Foglio sincronizzato live.");
          return sellerRows;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Errore sconosciuto durante il fetch del foglio.";
          await insertSyncLog(supabase, seller.id, "error", message);
          return [];
        }
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

    const sellerBreakdown: SellerDashboardBreakdown[] = [...new Set(currentRows.map((row) => row.seller))]
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
      .sort((left, right) => right.summary.revenueTotal - left.summary.revenueTotal);

    const firstDebug = parserDebug[0];

    return NextResponse.json(
      {
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
        sellerBreakdown,
        detectedHeaderRowIndex: firstDebug?.detectedHeaderRowIndex ?? -1,
        detectedHeaders: firstDebug?.detectedHeaders ?? [],
        parsedRowCount: firstDebug?.parsedRowCount ?? 0,
        validRowCount: firstDebug?.validRowCount ?? 0,
        firstTwoNormalizedRows: firstDebug?.firstTwoNormalizedRows ?? [],
        parserDebug,
        meta: {
          lastUpdated: new Date().toISOString(),
          source: "csv_public",
          availableSellers: activeSellers.map((seller) => seller.name),
          totalRows: currentRows.length
        }
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Errore durante il caricamento live della dashboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
