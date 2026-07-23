import { format } from "date-fns";
import { it } from "date-fns/locale";

import { SellerRecord, SellerSheetEntry, SellerSheetsMap } from "@/lib/types";

const LEGACY_MONTH_FIELDS = [
  { field: "sheet_url_april", month: 4 },
  { field: "sheet_url_may", month: 5 }
] as const;

type LegacySellerShape = Pick<SellerRecord, "sheet_url_april" | "sheet_url_may" | "sheets">;

function toMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function getCurrentSellerSheetYear() {
  return new Date().getFullYear();
}

export function normalizeSellerSheetsMap(
  sheets: SellerSheetsMap | null | undefined,
) {
  const normalized: SellerSheetsMap = {};

  if (sheets && typeof sheets === "object") {
    for (const [key, value] of Object.entries(sheets)) {
      if (typeof value !== "string") {
        continue;
      }

      const trimmedValue = value.trim();
      if (!trimmedValue) {
        continue;
      }

      const match = key.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
      if (!match) {
        continue;
      }

      normalized[`${match[1]}-${match[2]}`] = trimmedValue;
    }
  }

  return normalized;
}

function sheetsFromLegacyField(
  field: typeof LEGACY_MONTH_FIELDS[number]["field"],
  fallbackYear: number,
  seller: Partial<LegacySellerShape> | SellerSheetsMap | null | undefined
) {
  if (!seller || typeof seller !== "object" || !(field in seller)) {
    return null;
  }

  const rawValue = seller[field];
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return null;
  }

  const monthConfig = LEGACY_MONTH_FIELDS.find((entry) => entry.field === field);
  if (!monthConfig) {
    return null;
  }

  return {
    key: toMonthKey(fallbackYear, monthConfig.month),
    url: rawValue.trim()
  };
}

export function getSellerSheetsMap(
  seller: Partial<LegacySellerShape>,
  fallbackYear = getCurrentSellerSheetYear()
) {
  const normalized = normalizeSellerSheetsMap(seller.sheets);

  for (const legacyField of LEGACY_MONTH_FIELDS) {
    const legacyValue = sheetsFromLegacyField(legacyField.field, fallbackYear, seller);
    if (legacyValue) {
      normalized[legacyValue.key] = legacyValue.url;
    }
  }

  return normalized;
}

export function getSellerSheetEntries(
  seller: Partial<LegacySellerShape>,
  fallbackYear = getCurrentSellerSheetYear()
): SellerSheetEntry[] {
  return Object.entries(getSellerSheetsMap(seller, fallbackYear))
    .map(([key, url]) => {
      const [yearValue, monthValue] = key.split("-");
      const year = Number(yearValue);
      const month = Number(monthValue);

      return {
        key,
        year,
        month,
        label: format(new Date(year, month - 1, 1), "LLLL yyyy", { locale: it }),
        url
      };
    })
    .sort((left, right) => left.key.localeCompare(right.key));
}

export function buildSellerSheetsPayload(sheets: SellerSheetsMap | null | undefined) {
  const normalized = normalizeSellerSheetsMap(sheets);
  return Object.keys(normalized).length > 0 ? normalized : {};
}

export function getFirstSellerSheetUrl(sheets: SellerSheetsMap | null | undefined) {
  const entries = Object.entries(buildSellerSheetsPayload(sheets)).sort(([leftKey], [rightKey]) =>
    leftKey.localeCompare(rightKey)
  );

  return entries[0]?.[1] ?? null;
}
