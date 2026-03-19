"use client";

import { CalendarDays, RefreshCw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  return (
    <section className="surface-card rounded-[1.75rem] border border-white/80 p-3 sm:rounded-[2.1rem] sm:p-4">
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <div className="surface-pill inline-flex min-w-max gap-2 rounded-[1.35rem] border border-white/80 p-1.5 sm:rounded-[1.6rem] sm:p-2">
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
                      "h-11 rounded-full px-4 text-sm font-semibold transition-all duration-200 sm:h-12 sm:px-5",
                      isActive
                        ? "bg-primary text-white shadow-soft"
                        : "text-slate-500 hover:bg-white/90 hover:text-slate-900"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-center lg:justify-end">
          <Select
            value={filters.seller}
            onValueChange={(value) =>
              onChange({
                ...filters,
                seller: value
              })
            }
          >
            <SelectTrigger className="h-11 w-full min-w-0 rounded-full pl-4 shadow-none sm:h-12 sm:min-w-[220px]">
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
            <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2 lg:flex lg:items-center">
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
                  className="h-11 w-full min-w-0 rounded-full pl-11 sm:h-12 sm:min-w-[168px]"
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
                className="h-11 w-full min-w-0 rounded-full sm:h-12 sm:min-w-[168px]"
              />
            </div>
          ) : (
            <div className="surface-pill flex h-11 items-center rounded-full border border-white/80 px-4 text-sm text-slate-500 sm:h-12 sm:px-5">
              Range attivo
            </div>
          )}

          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-11 rounded-full px-5 sm:h-12"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
    </section>
  );
}
