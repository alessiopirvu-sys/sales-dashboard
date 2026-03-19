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
    <section className="surface-card rounded-[2.1rem] border border-white/80 p-4">
      <div className="flex w-full items-center justify-between gap-4 max-lg:flex-wrap">
        <div className="flex min-w-0 items-center gap-3">
          <div className="surface-pill flex gap-2 rounded-[1.6rem] border border-white/80 p-2 max-lg:flex-wrap lg:flex-nowrap">
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
                    "h-12 rounded-full px-5 text-sm font-semibold transition-all duration-200",
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

        <div className="ml-auto flex shrink-0 items-center gap-3 max-lg:flex-wrap max-lg:justify-end lg:flex-nowrap">
          <Select
            value={filters.seller}
            onValueChange={(value) =>
              onChange({
                ...filters,
                seller: value
              })
            }
          >
            <SelectTrigger className="h-12 min-w-[220px] rounded-full pl-4 shadow-none">
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
            <div className="flex items-center gap-2 max-lg:flex-wrap lg:flex-nowrap">
              <div className="relative">
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
                  className="h-12 min-w-[168px] rounded-full pl-11"
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
                className="h-12 min-w-[168px] rounded-full"
              />
            </div>
          ) : (
            <div className="surface-pill flex h-12 shrink-0 items-center rounded-full border border-white/80 px-5 text-sm text-slate-500">
              Range attivo
            </div>
          )}

          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-12 shrink-0 rounded-full px-5"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
    </section>
  );
}
