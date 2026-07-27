"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre"
];

const YEARS = Array.from({ length: 6 }, (_, index) => 2024 + index);

export function KpiMonthSelector({
  month,
  year,
  onMonthChange,
  onYearChange,
  onPreviousMonth,
  onNextMonth
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-lg px-2.5"
          onClick={onPreviousMonth}
          title="Mese precedente"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-lg px-2.5"
          onClick={onNextMonth}
          title="Mese successivo"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid min-w-[260px] flex-1 gap-2 sm:grid-cols-2">
        <Select value={String(month)} onValueChange={(value) => onMonthChange(Number(value))}>
          <SelectTrigger className="h-9 rounded-lg">
            <SelectValue placeholder="Seleziona mese" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((label, index) => (
              <SelectItem key={label} value={String(index + 1)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(year)} onValueChange={(value) => onYearChange(Number(value))}>
          <SelectTrigger className="h-9 rounded-lg">
            <SelectValue placeholder="Seleziona anno" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
