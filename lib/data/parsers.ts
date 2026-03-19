import { parse, isValid, format } from "date-fns";

export function parseItalianDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const trimmed = value.trim();
  const italianParsed = parse(trimmed, "dd/MM/yyyy", new Date());
  if (isValid(italianParsed)) {
    return format(italianParsed, "yyyy-MM-dd");
  }

  const isoParsed = new Date(trimmed);
  if (!Number.isNaN(isoParsed.getTime())) {
    return format(isoParsed, "yyyy-MM-dd");
  }

  return null;
}

export function normalizeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const cleaned = value
    .trim()
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeString(value: unknown, fallback = "Non assegnato"): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim();
  return cleaned || fallback;
}
