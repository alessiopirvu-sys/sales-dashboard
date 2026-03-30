import Papa from "papaparse";
import { NextRequest, NextResponse } from "next/server";

import {
  parseFiltersFromSearchParams,
  resolveDateRange,
  resolvePreviousDateRange
} from "@/lib/data/filters";
import {
  aggregateSalesRowsByPeriod,
  buildSellerRanking,
  buildTrendSeries,
  calculateSalesKpis,
  calculateSummaryMetrics
} from "@/lib/kpi";
import { normalizeCell, normalizeRowsFromSheet } from "@/lib/normalize";
import { DashboardFilters, RawSheetRow, SheetSourceConfig } from "@/lib/types";

const PUBLISHED_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLU5MC_Ca7TZEH2HpDxPU1WHLM1BatYWPxO3IZZ_aucBLR0hLquMEARYR7Rn_OVsepEUsrtyn4YAnO/pub?gid=0&single=true&output=csv";

const sheetSource: SheetSourceConfig = {
  spreadsheetId: "published-google-sheet",
  sheetName: "KPI Vendite",
  sellerName: "Team",
  publishedCsvUrl: PUBLISHED_CSV_URL,
  columns: {
    date: "GIORNO",
    type: "TIPO",
    callsFr: "N° CHIAMATE FR",
    notInterestedFr: "NON INTERESSATI",
    nrFr: "NR",
    appointmentsBookedFr: "APP PRESI FR",
    appointmentsDoneFr: "SVOLTI FR",
    noShowFr: "NO SHOW FR",
    closedFr: "CHIUSI FR",
    revenueFr: "SOLDI FR",
    contactsFr: "CONTATTI FR",
    d2dBase: "D2D",
    appointmentsBookedD2d: "APP D2D",
    appointmentsDoneD2d: "SVOLTI D2D",
    noShowD2d: "NO SHOW D2D",
    closedD2d: "CHIUSI D2D",
    revenueD2d: "SOLDI D2D",
    officeBase: "UFFICIO",
    appointmentsDoneOffice: "UFFICIO SVOLTI",
    noShowOffice: "NO SHOW UFFICIO",
    closedOffice: "UFFICIO CHIUSI",
    revenueOffice: "UFFICIO SOLDI",
    rifissatoOffice: "RIFISSATO",
    referenze: "REFERENZE",
    closedReferenze: "CHIUSI REFERENZE",
    revenueReferenze: "SOLDI REFERENZE"
  }
};

async function fetchPublishedCsvRows(): Promise<RawSheetRow[]> {
  const response = await fetch(PUBLISHED_CSV_URL, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Google Sheets CSV.");
  }

  const csvText = await response.text();
  const parsed = Papa.parse<RawSheetRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => normalizeCell(header)
  });

  if (parsed.errors.length > 0) {
    throw new Error("Failed to parse Google Sheets CSV.");
  }

  return parsed.data.map((row) =>
    Object.entries(row).reduce<RawSheetRow>((accumulator, [key, value]) => {
      accumulator[normalizeCell(key)] = value;
      return accumulator;
    }, {})
  );
}

function filterRowsByRange(
  rows: ReturnType<typeof normalizeRowsFromSheet>,
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

export async function GET(request: NextRequest) {
  try {
    const filters = parseFiltersFromSearchParams(request.nextUrl.searchParams);
    const rawRows = await fetchPublishedCsvRows();
    const normalizedRows = normalizeRowsFromSheet(rawRows, sheetSource);

    const currentRange = resolveDateRange(filters);
    const previousRange = resolvePreviousDateRange(filters);
    const currentRows = filterRowsByRange(normalizedRows, filters, currentRange);
    const previousRows = filterRowsByRange(normalizedRows, filters, previousRange);

    const summary = calculateSummaryMetrics(currentRows);
    const currentAggregated = aggregateSalesRowsByPeriod(currentRows);
    const currentKpis = calculateSalesKpis(currentAggregated);
    const previousSummary = calculateSummaryMetrics(previousRows);

    return NextResponse.json(
      {
        summary,
        ranking: buildSellerRanking(currentRows),
        trend: buildTrendSeries(currentRows),
        comparison: {
          current: {
            revenue: summary.revenue,
            dealsClosed: summary.dealsClosed,
            closingRate: summary.closingRate
          },
          previous: {
            revenue: previousSummary.revenue,
            dealsClosed: previousSummary.dealsClosed,
            closingRate: previousSummary.closingRate
          }
        },
        metrics: {
          calls: currentAggregated.callsFr,
          booked: currentAggregated.appointmentsBookedFr,
          done: currentAggregated.appointmentsDoneFr,
          closed: currentAggregated.closedFr,
          revenue: currentAggregated.revenueFr,
          ticket: currentKpis.fr.averageTicket,
          contactRate: currentKpis.fr.contactRate,
          nrRate: currentKpis.fr.nrRate,
          appointmentsConversionRate: currentKpis.fr.appointmentsConversionRate,
          showUpRate: currentKpis.fr.showUpRate,
          noShowRate: currentKpis.fr.noShowRate,
          closingRate: currentKpis.fr.closingRate
        },
        channelKpis: {
          fr: currentKpis.fr,
          d2d: currentKpis.d2d,
          office: currentKpis.office
        },
        meta: {
          lastUpdated: new Date().toISOString(),
          source: "csv_public",
          availableSellers: [...new Set(normalizedRows.map((row) => row.seller))].sort(),
          totalRows: currentRows.length,
          csvUrl: PUBLISHED_CSV_URL
        }
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Errore durante il caricamento del foglio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
