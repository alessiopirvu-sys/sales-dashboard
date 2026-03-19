import Papa from "papaparse";

import { googleSheetsApiKey, sheetSources, sheetsMode } from "@/config/sheets";
import { mockSalesRows } from "@/lib/data/mock-sales-data";
import { normalizeCell, normalizeRowsFromSheet } from "@/lib/normalize";
import { NormalizedSalesRow, RawSheetRow, SheetSourceConfig } from "@/lib/types";

async function fetchCsvRows(source: SheetSourceConfig): Promise<RawSheetRow[]> {
  if (!source.publishedCsvUrl) {
    return [];
  }

  const response = await fetch(source.publishedCsvUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Download CSV fallito per il foglio ${source.sheetName}.`);
  }

  const csvText = await response.text();
  const parsed = Papa.parse<RawSheetRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => normalizeCell(header)
  });

  if (parsed.errors.length > 0) {
    throw new Error(`Parsing CSV non riuscito per il foglio ${source.sheetName}.`);
  }

  return parsed.data.map((row) =>
    Object.entries(row).reduce<RawSheetRow>((accumulator, [key, value]) => {
      accumulator[normalizeCell(key)] = value;
      return accumulator;
    }, {})
  );
}

async function fetchApiRows(source: SheetSourceConfig): Promise<RawSheetRow[]> {
  if (!googleSheetsApiKey) {
    throw new Error("GOOGLE_SHEETS_API_KEY mancante.");
  }

  const range = encodeURIComponent(source.sheetName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${source.spreadsheetId}/values/${range}?key=${googleSheetsApiKey}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Google Sheets API non disponibile per il foglio ${source.sheetName}.`);
  }

  const payload = (await response.json()) as { values?: string[][] };
  const [headers = [], ...rows] = payload.values ?? [];
  const normalizedHeaders = headers.map((header) => normalizeCell(header));

  return rows.map((row) =>
    normalizedHeaders.reduce<RawSheetRow>((accumulator, header, index) => {
      accumulator[header] = row[index] ?? "";
      return accumulator;
    }, {})
  );
}

async function fetchRowsForSource(source: SheetSourceConfig): Promise<RawSheetRow[]> {
  if (sheetsMode === "google_api") {
    return fetchApiRows(source);
  }

  return fetchCsvRows(source);
}

export async function getAllGoogleSheetsRows(): Promise<{
  rows: NormalizedSalesRow[];
  source: "multi" | "csv_public" | "google_api" | "mock";
}> {
  const activeSources = sheetSources.length
    ? sheetSources
    : [
        {
          spreadsheetId: "mock",
          sheetName: "Mock Data",
          sellerName: "Team Demo",
          columns: {
            date: "date",
            type: "type",
            callsFr: "calls",
            notInterestedFr: "not_interested_fr",
            nrFr: "nr_fr",
            appointmentsBookedFr: "appointments_booked",
            appointmentsDoneFr: "appointments_done",
            noShowFr: "no_show_fr",
            closedFr: "deals_closed",
            revenueFr: "revenue",
            contactsFr: "contacts_fr",
            d2dBase: "d2d_base",
            appointmentsBookedD2d: "appointments_booked_d2d",
            appointmentsDoneD2d: "appointments_done_d2d",
            noShowD2d: "no_show_d2d",
            closedD2d: "closed_d2d",
            revenueD2d: "revenue_d2d",
            officeBase: "office_base",
            appointmentsDoneOffice: "appointments_done_office",
            noShowOffice: "no_show_office",
            closedOffice: "closed_office",
            revenueOffice: "revenue_office"
          }
        }
      ];

  const datasets = await Promise.all(
    activeSources.map(async (source) => {
      const rawRows =
        source.spreadsheetId === "mock" ? mockSalesRows : await fetchRowsForSource(source);
      return normalizeRowsFromSheet(rawRows, source);
    })
  );

  return {
    rows: datasets.flat(),
    source: activeSources[0]?.spreadsheetId === "mock"
      ? "mock"
      : activeSources.length > 1
        ? "multi"
        : sheetsMode
  };
}
