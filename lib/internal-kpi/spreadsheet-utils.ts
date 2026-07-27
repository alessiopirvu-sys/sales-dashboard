import { buildInternalKpiPeriodSummary, deriveInternalKpiRow, isInternalKpiActiveDay } from "@/lib/internal-kpi/formulas";
import {
  InternalKpiDailyRow,
  InternalKpiFieldKey,
  InternalKpiInputFieldKey,
  InternalKpiPeriodSummary,
  InternalKpiRowInput
} from "@/lib/internal-kpi/types";
import {
  getSpreadsheetColumnByKey,
  isEditableSpreadsheetColumn,
  KpiSpreadsheetColumn,
  KpiSpreadsheetColumnKey
} from "@/lib/internal-kpi/spreadsheet-config";

const integerFormatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 0
});

const currencyFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const percentageFormatter = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1
});

export function getCalendarCellLabel(reportDate: string, _dayType: InternalKpiRowInput["dayType"]) {
  const date = new Date(reportDate);
  const compactDate = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit"
  })
    .format(date)
    .replace("/", "-");

  return {
    compactDate
  };
}

export function formatSpreadsheetValue(
  value: number,
  column: KpiSpreadsheetColumn,
  hasRowActivity: boolean
) {
  if (!hasRowActivity && value === 0) {
    return "";
  }

  switch (column.format) {
    case "currency":
      return currencyFormatter.format(value);
    case "percentage":
      return `${percentageFormatter.format(value)}%`;
    case "integer":
      return integerFormatter.format(value);
    default:
      return String(value);
  }
}

export function getSpreadsheetCellNumericValue(
  row: InternalKpiDailyRow,
  columnKey: Exclude<KpiSpreadsheetColumnKey, "calendar">
) {
  if (columnKey in row.input) {
    return row.input[columnKey as InternalKpiInputFieldKey];
  }

  return row.derived[columnKey as Exclude<InternalKpiFieldKey, InternalKpiInputFieldKey>];
}

export function getSpreadsheetCellDisplayValue(
  row: InternalKpiDailyRow,
  column: KpiSpreadsheetColumn
) {
  if (column.key === "calendar") {
    return "";
  }

  const value = getSpreadsheetCellNumericValue(row, column.key);
  const hasRowActivity = isInternalKpiActiveDay(row.input);

  return formatSpreadsheetValue(value, column, hasRowActivity);
}

export function parseSpreadsheetInputValue(rawValue: string, column: KpiSpreadsheetColumn) {
  if (!isEditableSpreadsheetColumn(column)) {
    return null;
  }

  const normalized = rawValue.replace(",", ".").trim();

  if (normalized === "") {
    return 0;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (column.format === "integer") {
    return Math.max(0, Math.round(parsed));
  }

  if (column.format === "currency") {
    return Math.max(0, Math.round(parsed * 100) / 100);
  }

  return Math.max(0, parsed);
}

export function updateSpreadsheetRowValue(
  row: InternalKpiDailyRow,
  fieldKey: InternalKpiInputFieldKey,
  nextValue: number
) {
  const nextInput = {
    ...row.input,
    [fieldKey]: nextValue
  };
  const next = deriveInternalKpiRow(nextInput);

  return {
    ...row,
    input: next.input,
    derived: next.derived,
    validation: next.validation
  } satisfies InternalKpiDailyRow;
}

export function getCellValidationMessage(
  row: InternalKpiDailyRow,
  columnKey: KpiSpreadsheetColumnKey
) {
  const matchingError = row.validation.errors.find((error) =>
    error.fieldKeys.includes(columnKey as InternalKpiFieldKey)
  );

  return matchingError?.message ?? null;
}

export function buildSpreadsheetTotals(rows: InternalKpiDailyRow[]): InternalKpiPeriodSummary {
  return buildInternalKpiPeriodSummary(rows.map((row) => row.input));
}

export function isCalculatedSpreadsheetCell(columnKey: KpiSpreadsheetColumnKey) {
  const column = getSpreadsheetColumnByKey(columnKey);

  return column ? !isEditableSpreadsheetColumn(column) : false;
}
