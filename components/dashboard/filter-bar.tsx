"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarDays, RefreshCw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resolveDateRange } from "@/lib/data/filters";
import { cn } from "@/lib/utils";
import { DashboardFilters, TimePreset } from "@/lib/types";

const presets: Array<{ label: string; value: TimePreset }> = [
  { label: "Oggi", value: "today" },
  { label: "Settimana", value: "week" },
  { label: "Mese", value: "month" },
  { label: "Range personalizzato", value: "custom" }
];

type FilterBarProps = {
  filters: DashboardFilters;
  sellerOptions: Array<{ label: string; value: string }>;
  onChange: (filters: DashboardFilters) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
};

export function FilterBar({
  filters,
  sellerOptions,
  onChange,
  onRefresh,
  isRefreshing
}: FilterBarProps) {
  const activeRange = resolveDateRange(filters);
  const activeRangeLabel = `${format(new Date(activeRange.startDate), "dd MMMM yyyy", {
    locale: it
  })} - ${format(new Date(activeRange.endDate), "dd MMMM yyyy", { locale: it })}`;

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <div className="min-w-0">
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="inline-flex min-w-max gap-2 rounded-2xl bg-slate-100 p-1">
              {presets.map((preset) => {
                const isActive = filters.preset === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...filters,
                        preset: preset.value
                      })
                    }
                    className={cn(
                      "h-10 rounded-xl px-4 text-sm font-semibold transition-all duration-200 sm:px-5",
                      isActive
                        ? "bg-primary text-white"
                        : "text-slate-500 hover:bg-white hover:text-slate-900"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-center xl:justify-end">
          <Select
            value={filters.seller}
            onValueChange={(value) =>
              onChange({
                ...filters,
                seller: value
              })
            }
          >
            <SelectTrigger className="h-11 w-full min-w-0 rounded-2xl border-slate-200 pl-4 shadow-none sm:min-w-[220px]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <SelectValue placeholder="Filtra venditore" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {sellerOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filters.preset === "custom" ? (
            <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2 xl:flex xl:items-center">
              <div className="relative min-w-0">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                <Input
                  type="date"
                  value={filters.startDate ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...filters,
                      startDate: event.target.value
                    })
                  }
                  className="h-11 w-full min-w-0 rounded-2xl border-slate-200 pl-11 sm:min-w-[168px]"
                />
              </div>
              <Input
                type="date"
                value={filters.endDate ?? ""}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    endDate: event.target.value
                  })
                }
                className="h-11 w-full min-w-0 rounded-2xl border-slate-200 sm:min-w-[168px]"
              />
            </div>
          ) : (
            <div className="flex h-11 items-center whitespace-nowrap rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 sm:px-5">
              {activeRangeLabel}
            </div>
          )}

          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-11 rounded-2xl px-5"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
    </section>
  );
}
