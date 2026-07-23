import { format, isValid, parse, setYear } from "date-fns";

import { NormalizedSalesRow, RawSheetRow, SheetSourceConfig } from "@/lib/types";

const WEEKDAY_MARKERS = new Set(["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"]);

type DateParsingOptions = {
  referenceYear?: number;
  forcedMonth?: number;
};

function getValidForcedMonth(month: number | undefined) {
  return month !== undefined && month >= 1 && month <= 12 ? month : undefined;
}

function extractMonthFromRawDate(raw: string) {
  const normalized = raw.trim();
  if (!normalized) {
    return null;
  }

  const dayMonthMatch = normalized.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-]\d{2,4})?$/);
  if (dayMonthMatch) {
    const month = Number(dayMonthMatch[2]);
    return month >= 1 && month <= 12 ? month : null;
  }

  const isoMatch = normalized.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (isoMatch) {
    const month = Number(isoMatch[2]);
    return month >= 1 && month <= 12 ? month : null;
  }

  return null;
}

function parseYearlessDate(raw: string, referenceYear: number, forcedMonth?: number) {
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const sourceMonth = Number(match[2]);
  const month = getValidForcedMonth(forcedMonth) ?? sourceMonth;
  const candidate = new Date(referenceYear, month - 1, day);

  if (
    candidate.getFullYear() !== referenceYear ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  return format(candidate, "yyyy-MM-dd");
}

export function parseItalianDate(
  value: unknown,
  options: DateParsingOptions = {}
): string | null {
  const referenceYear = options.referenceYear ?? new Date().getFullYear();
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

  const yearlessDate = parseYearlessDate(raw, referenceYear, options.forcedMonth);
  if (yearlessDate) {
    return yearlessDate;
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
    forcedMonth?: number;
  }
): NormalizedSalesRow | null {
  const rawDate = normalizeCell(row[source.columns.date]);
  const forcedMonth = getValidForcedMonth(options?.forcedMonth);
  const sourceMonth = extractMonthFromRawDate(rawDate);

  // For month-specific sheets, ignore any row whose explicit date belongs to another month.
  if (forcedMonth !== undefined && sourceMonth !== null && sourceMonth !== forcedMonth) {
    return null;
  }

  const date = parseItalianDate(rawDate, {
    referenceYear: options?.referenceYear,
    forcedMonth
  });
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
    forcedMonth?: number;
  }
): NormalizedSalesRow[] {
  return rows
    .map((row) => parseSalesSheetRow(row, source, options))
    .filter((row): row is NormalizedSalesRow => row !== null);
}
