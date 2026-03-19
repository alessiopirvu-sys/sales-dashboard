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
  | "dealsClosed"
  | "revenue"
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
    tableLabel: "Chiamate",
    format: formatCompactNumber,
    getValue: (row) => row.calls
  },
  {
    key: "appointmentsBooked",
    label: "App presi",
    tableLabel: "App presi",
    format: formatCompactNumber,
    getValue: (row) => row.appointmentsBooked
  },
  {
    key: "appointmentsDone",
    label: "Svolti",
    tableLabel: "Svolti",
    format: formatCompactNumber,
    getValue: (row) => row.appointmentsDone
  },
  {
    key: "dealsClosed",
    label: "Chiusi",
    tableLabel: "Chiusi",
    format: formatCompactNumber,
    getValue: (row) => row.dealsClosed
  },
  {
    key: "revenue",
    label: "Fatturato €",
    tableLabel: "Fatturato",
    format: formatCurrency,
    getValue: (row) => row.revenue
  },
  {
    key: "showUpRate",
    label: "% Show-up",
    tableLabel: "Show-up %",
    format: formatPercentage,
    getValue: (row) => row.showUpRate
  },
  {
    key: "closingRate",
    label: "% Closing",
    tableLabel: "Closing %",
    format: formatPercentage,
    getValue: (row) => row.closingRate
  }
];

export function getRankingMetricConfig(metricKey: RankingMetricKey) {
  return rankingMetricOptions.find((metric) => metric.key === metricKey) ?? rankingMetricOptions[4];
}
