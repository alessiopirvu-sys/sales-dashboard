import {
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays
} from "date-fns";

import { DashboardFilters } from "@/lib/types";

function getTodayIso() {
  return format(new Date(), "yyyy-MM-dd");
}

export function parseFiltersFromSearchParams(searchParams: URLSearchParams): DashboardFilters {
  const preset = (searchParams.get("preset") as DashboardFilters["preset"]) || "month";
  const seller = searchParams.get("seller") || "all";
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  return {
    preset,
    seller,
    startDate,
    endDate
  };
}

export function resolveDateRange(filters: DashboardFilters) {
  const now = new Date();

  switch (filters.preset) {
    case "today":
      return { startDate: getTodayIso(), endDate: getTodayIso() };
    case "week":
      return {
        startDate: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        endDate: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")
      };
    case "month":
      return {
        startDate: format(startOfMonth(now), "yyyy-MM-dd"),
        endDate: format(endOfMonth(now), "yyyy-MM-dd")
      };
    case "custom":
      return {
        startDate: filters.startDate || format(subDays(now, 29), "yyyy-MM-dd"),
        endDate: filters.endDate || getTodayIso()
      };
    default:
      return {
        startDate: format(startOfMonth(now), "yyyy-MM-dd"),
        endDate: format(endOfMonth(now), "yyyy-MM-dd")
      };
  }
}

export function resolvePreviousDateRange(filters: DashboardFilters) {
  const current = resolveDateRange(filters);
  const start = new Date(current.startDate);
  const end = new Date(current.endDate);
  const rangeLength = Math.max(1, differenceInCalendarDays(end, start) + 1);

  return {
    startDate: format(subDays(start, rangeLength), "yyyy-MM-dd"),
    endDate: format(subDays(start, 1), "yyyy-MM-dd")
  };
}

export function buildDashboardUrl(filters: DashboardFilters) {
  return buildDashboardUrlWithOptions(filters);
}

export function buildDashboardUrlWithOptions(
  filters: DashboardFilters,
  options?: {
    cacheBust?: string;
    details?: "lite" | "full";
  }
) {
  const params = new URLSearchParams({
    preset: filters.preset,
    seller: filters.seller
  });

  if (filters.startDate) {
    params.set("startDate", filters.startDate);
  }

  if (filters.endDate) {
    params.set("endDate", filters.endDate);
  }

  if (options?.cacheBust) {
    params.set("cacheBust", options.cacheBust);
  }

  if (options?.details) {
    params.set("details", options.details);
  }

  return `/api/dashboard-data?${params.toString()}`;
}
