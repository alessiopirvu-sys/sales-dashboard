import Papa from "papaparse";

import { INVALID_SHEETS_CSV_MESSAGE, isValidGoogleSheetsCsvUrl } from "@/lib/google-sheets-url";
import { normalizeCell, normalizeRowsFromSheet, parseFlexibleNumber } from "@/lib/normalize";
import { REQUIRED_SHEET_HEADERS, SALES_SHEET_COLUMNS } from "@/lib/sheets-schema";
import {
  NormalizedSalesRow,
  RawSheetRow,
  SellerRecord,
  SellerSheetDebug,
  SellerValidationResult,
  SheetSourceConfig
} from "@/lib/types";

const HEADER_DETECTION_HEADERS = ["GIORNO", "TIPO", "N° CHIAMATE FR"] as const;
const SOURCE_COLUMNS = Object.values(SALES_SHEET_COLUMNS);
const REQUIRED_NUMERIC_COLUMNS = SOURCE_COLUMNS.filter(
  (column) => column !== SALES_SHEET_COLUMNS.date && column !== SALES_SHEET_COLUMNS.type
);

async function fetchCsvTextFromUrl(url: string): Promise<string> {
  if (!isValidGoogleSheetsCsvUrl(url)) {
    throw new Error("Invalid Google Sheets CSV URL");
  }

  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to fetch Google Sheets CSV.");
  }

  return response.text();
}

function parseCsvMatrix(csvText: string): string[][] {
  const parsed = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
    transform: (value) => normalizeCell(value)
  });

  if (parsed.errors.length > 0) {
    throw new Error("Unable to parse Google Sheets CSV.");
  }

  return parsed.data;
}

function detectHeaderRowIndex(matrix: string[][]) {
  return matrix.findIndex((row) => {
    const normalizedRow = row.map((cell) => normalizeCell(cell));
    return HEADER_DETECTION_HEADERS.every((header) => normalizedRow.includes(header));
  });
}

function buildRowObjectsFromMatrix(matrix: string[][]) {
  const detectedHeaderRowIndex = detectHeaderRowIndex(matrix);
  if (detectedHeaderRowIndex === -1) {
    throw new Error("Unable to detect the real Google Sheets header row.");
  }

  const detectedHeaders = matrix[detectedHeaderRowIndex].map((cell) => normalizeCell(cell));
  const headerIndexMap = new Map<string, number>();
  detectedHeaders.forEach((header, index) => {
    if (SOURCE_COLUMNS.includes(header) && !headerIndexMap.has(header)) {
      headerIndexMap.set(header, index);
    }
  });

  const foundHeaders = Array.from(headerIndexMap.keys());
  const missingHeaders = REQUIRED_SHEET_HEADERS.filter((header) => !foundHeaders.includes(header));

  const rows =
    missingHeaders.length > 0
      ? []
      : matrix.slice(detectedHeaderRowIndex + 1).map((row) =>
          SOURCE_COLUMNS.reduce<RawSheetRow>((accumulator, column) => {
            const columnIndex = headerIndexMap.get(column);
            accumulator[column] =
              columnIndex === undefined ? "" : normalizeCell(row[columnIndex] ?? "");
            return accumulator;
          }, {})
        );

  return {
    detectedHeaderRowIndex,
    detectedHeaders,
    rows,
    missingHeaders
  };
}

function isValidDataCandidate(row: RawSheetRow) {
  const rawDate = normalizeCell(row[SALES_SHEET_COLUMNS.date]);
  if (!rawDate) {
    return false;
  }

  return REQUIRED_NUMERIC_COLUMNS.some((column) => parseFlexibleNumber(row[column]) > 0);
}

export async function fetchCsvRowsFromUrl(url: string): Promise<RawSheetRow[]> {
  const csvText = await fetchCsvTextFromUrl(url);
  const matrix = parseCsvMatrix(csvText);
  const parsed = buildRowObjectsFromMatrix(matrix);
  return parsed.rows.filter((row) => isValidDataCandidate(row));
}

export function validateSheetHeaders(rows: RawSheetRow[]): SellerValidationResult {
  const firstRow = rows[0] ?? {};
  const headers = Object.keys(firstRow).map((header) => normalizeCell(header));
  const missingHeaders = REQUIRED_SHEET_HEADERS.filter((header) => !headers.includes(header));

  return {
    valid: missingHeaders.length === 0,
    message:
      missingHeaders.length === 0
        ? "Foglio valido."
        : "Il foglio non contiene tutte le intestazioni richieste.",
    headers,
    missingHeaders
  };
}

export async function validateSellerSheetUrl(sheetUrl: string): Promise<SellerValidationResult> {
  if (!isValidGoogleSheetsCsvUrl(sheetUrl)) {
    return {
      valid: false,
      message: INVALID_SHEETS_CSV_MESSAGE
    };
  }

  const csvText = await fetchCsvTextFromUrl(sheetUrl);
  const matrix = parseCsvMatrix(csvText);
  const parsed = buildRowObjectsFromMatrix(matrix);

  return {
    valid: parsed.missingHeaders.length === 0,
    message:
      parsed.missingHeaders.length === 0
        ? "Foglio valido."
        : "Il foglio non contiene tutte le intestazioni richieste.",
    headers: parsed.detectedHeaders,
    missingHeaders: parsed.missingHeaders
  };
}

export async function fetchAndParseSellerSheet(
  seller: Pick<SellerRecord, "id" | "name" | "sheet_url">,
  options?: {
    sheetUrl?: string;
    sourceLabel?: string;
  },
  referenceYear = new Date().getFullYear()
): Promise<{ rows: NormalizedSalesRow[]; debug: SellerSheetDebug }> {
  const sheetUrl = options?.sheetUrl ?? seller.sheet_url;
  const sourceLabel = options?.sourceLabel ?? "Principale";
  const csvText = await fetchCsvTextFromUrl(sheetUrl);
  const matrix = parseCsvMatrix(csvText);
  const parsed = buildRowObjectsFromMatrix(matrix);
  const validCandidateRows = parsed.rows.filter((row) => isValidDataCandidate(row));

  const source: SheetSourceConfig = {
    spreadsheetId: seller.id,
    sheetName: seller.name,
    sellerName: seller.name,
    publishedCsvUrl: sheetUrl,
    columns: SALES_SHEET_COLUMNS
  };

  const normalizedRows = normalizeRowsFromSheet(validCandidateRows, source, {
    referenceYear
  });

  return {
    rows: normalizedRows,
    debug: {
      seller: seller.name,
      sourceLabel,
      detectedHeaderRowIndex: parsed.detectedHeaderRowIndex,
      detectedHeaders: parsed.detectedHeaders,
      parsedRowCount: parsed.rows.length,
      validRowCount: normalizedRows.length,
      skippedRowCount: Math.max(0, parsed.rows.length - normalizedRows.length),
      firstTwoNormalizedRows: normalizedRows.slice(0, 2).map((row) => ({
        date: row.date,
        seller: row.seller,
        type: row.type,
        callsFr: row.callsFr,
        appointmentsBookedFr: row.appointmentsBookedFr,
        appointmentsDoneFr: row.appointmentsDoneFr,
        closedFr: row.closedFr,
        revenueFr: row.revenueFr
      }))
    }
  };
}

export async function fetchAndNormalizeSellerRows(
  seller: Pick<SellerRecord, "id" | "name" | "sheet_url">,
  referenceYear = new Date().getFullYear()
): Promise<NormalizedSalesRow[]> {
  const result = await fetchAndParseSellerSheet(seller, undefined, referenceYear);
  return result.rows;
}
