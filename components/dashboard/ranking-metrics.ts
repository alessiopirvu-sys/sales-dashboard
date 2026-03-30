import {
  formatCompactNumber,
  formatCurrency,
  formatPercentage
} from "@/lib/formatters";
import { RankingRow } from "@/lib/types";

export type RankingMetricKey =
  | "calls"
  | "appointmentsBooked"
  | "appointmentsDone"
  | "dealsClosedTotal"
  | "revenueTotal"
  | "showUpRate"
  | "closingRate";

type RankingMetricConfig = {
  key: RankingMetricKey;
  label: string;
  tableLabel: string;
  format: (value: number) => string;
  getValue: (row: RankingRow) => number;
};

export const rankingMetricOptions: RankingMetricConfig[] = [
  {
    key: "calls",
    label: "Chiamate",
    tableLabel: "Chiamate FR",
    format: formatCompactNumber,
    getValue: (row) => row.calls
  },
  {
    key: "appointmentsBooked",
    label: "App presi",
    tableLabel: "App presi FR",
    format: formatCompactNumber,
    getValue: (row) => row.appointmentsBooked
  },
  {
    key: "appointmentsDone",
    label: "Svolti",
    tableLabel: "Svolti FR",
    format: formatCompactNumber,
    getValue: (row) => row.appointmentsDone
  },
  {
    key: "dealsClosedTotal",
    label: "Chiusi totali",
    tableLabel: "Chiusi totali",
    format: formatCompactNumber,
    getValue: (row) => row.dealsClosedTotal
  },
  {
    key: "revenueTotal",
    label: "Fatturato totale",
    tableLabel: "Fatturato totale",
    format: formatCurrency,
    getValue: (row) => row.revenueTotal
  },
  {
    key: "showUpRate",
    label: "% Show-up",
    tableLabel: "Show-up % FR",
    format: formatPercentage,
    getValue: (row) => row.showUpRate
  },
  {
    key: "closingRate",
    label: "% Closing",
    tableLabel: "Closing % FR",
    format: formatPercentage,
    getValue: (row) => row.closingRate
  }
];

export function getRankingMetricConfig(metricKey: RankingMetricKey) {
  return rankingMetricOptions.find((metric) => metric.key === metricKey) ?? rankingMetricOptions[4];
}
