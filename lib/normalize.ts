import { format, isValid, parse, setYear } from "date-fns";

import { NormalizedSalesRow, RawSheetRow, SheetSourceConfig } from "@/lib/types";

const WEEKDAY_MARKERS = new Set(["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"]);

export function parseItalianDate(
  value: unknown,
  referenceYear = new Date().getFullYear()
): string | null {
  if (typeof value !== "string" && !(value instanceof Date)) {
    return null;
  }

  if (value instanceof Date && isValid(value)) {
    return format(value, "yyyy-MM-dd");
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const supportedFormats = [
    "dd/MM/yyyy",
    "d/M/yyyy",
    "dd-MM-yyyy",
    "d-M-yyyy",
    "yyyy-MM-dd",
    "yyyy/MM/dd"
  ];

  for (const dateFormat of supportedFormats) {
    const parsed = parse(raw, dateFormat, new Date());
    if (isValid(parsed)) {
      return format(parsed, "yyyy-MM-dd");
    }
  }

  const yearlessFormats = ["dd/MM", "d/M", "dd-MM", "d-M"];
  for (const dateFormat of yearlessFormats) {
    const parsed = parse(raw, dateFormat, new Date());
    if (isValid(parsed)) {
      return format(setYear(parsed, referenceYear), "yyyy-MM-dd");
    }
  }

  const fallback = new Date(raw);
  if (isValid(fallback)) {
    return format(fallback, "yyyy-MM-dd");
  }

  return null;
}

export function parseFlexibleNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return 0;
  }

  const raw = String(value).trim();
  if (!raw) {
    return 0;
  }

  const normalized = raw
    .replace(/\s/g, "")
    .replace(/€/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(/,(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

export function parseSalesSheetRow(
  row: RawSheetRow,
  source: SheetSourceConfig,
  options?: {
    referenceYear?: number;
  }
): NormalizedSalesRow | null {
  const date = parseItalianDate(row[source.columns.date], options?.referenceYear);
  if (!date) {
    return null;
  }

  const callsFr = parseFlexibleNumber(row[source.columns.callsFr]);
  const appointmentsBookedFr = parseFlexibleNumber(row[source.columns.appointmentsBookedFr]);
  const appointmentsDoneFr = parseFlexibleNumber(row[source.columns.appointmentsDoneFr]);
  const closedFr = parseFlexibleNumber(row[source.columns.closedFr]);
  const revenueFr = parseFlexibleNumber(row[source.columns.revenueFr]);
  const explicitSeller = normalizeCell(row.seller);
  const normalizedType = normalizeCell(row[source.columns.type]).toUpperCase();
  const seller =
    explicitSeller && !WEEKDAY_MARKERS.has(explicitSeller.toUpperCase())
      ? explicitSeller
      : source.sellerName || (WEEKDAY_MARKERS.has(normalizedType) ? "Non assegnato" : normalizedType || "Non assegnato");

  return {
    date,
    type: normalizeCell(row[source.columns.type]),
    seller,
    callsFr,
    notInterestedFr: parseFlexibleNumber(row[source.columns.notInterestedFr]),
    nrFr: parseFlexibleNumber(row[source.columns.nrFr]),
    appointmentsBookedFr,
    appointmentsDoneFr,
    noShowFr: parseFlexibleNumber(row[source.columns.noShowFr]),
    closedFr,
    revenueFr,
    contactsFr: parseFlexibleNumber(row[source.columns.contactsFr]),
    d2dBase: parseFlexibleNumber(row[source.columns.d2dBase]),
    appointmentsBookedD2d: parseFlexibleNumber(row[source.columns.appointmentsBookedD2d]),
    appointmentsDoneD2d: parseFlexibleNumber(row[source.columns.appointmentsDoneD2d]),
    noShowD2d: parseFlexibleNumber(row[source.columns.noShowD2d]),
    closedD2d: parseFlexibleNumber(row[source.columns.closedD2d]),
    revenueD2d: parseFlexibleNumber(row[source.columns.revenueD2d]),
    officeBase: parseFlexibleNumber(row[source.columns.officeBase]),
    appointmentsDoneOffice: parseFlexibleNumber(row[source.columns.appointmentsDoneOffice]),
    noShowOffice: parseFlexibleNumber(row[source.columns.noShowOffice]),
    closedOffice: parseFlexibleNumber(row[source.columns.closedOffice]),
    revenueOffice: parseFlexibleNumber(row[source.columns.revenueOffice]),
    rifissatoOffice: parseFlexibleNumber(row[source.columns.rifissatoOffice]),
    referenze: parseFlexibleNumber(row[source.columns.referenze]),
    closedReferenze: parseFlexibleNumber(row[source.columns.closedReferenze]),
    revenueReferenze: parseFlexibleNumber(row[source.columns.revenueReferenze]),
    calls: callsFr,
    appointmentsBooked: appointmentsBookedFr,
    appointmentsDone: appointmentsDoneFr,
    dealsClosed: closedFr,
    revenue: revenueFr,
    sourceSheet: source.sheetName,
    spreadsheetId: source.spreadsheetId
  };
}

export function normalizeRowsFromSheet(
  rows: RawSheetRow[],
  source: SheetSourceConfig,
  options?: {
    referenceYear?: number;
  }
): NormalizedSalesRow[] {
  return rows
    .map((row) => parseSalesSheetRow(row, source, options))
    .filter((row): row is NormalizedSalesRow => row !== null);
}
