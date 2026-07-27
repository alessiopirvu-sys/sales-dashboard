import { InternalKpiDerivedFieldKey, InternalKpiInputFieldKey } from "@/lib/internal-kpi/types";

export type KpiSpreadsheetMetaKey = "calendar";

export type KpiSpreadsheetColumnKey =
  | KpiSpreadsheetMetaKey
  | InternalKpiInputFieldKey
  | InternalKpiDerivedFieldKey;

export type KpiSpreadsheetColumn = {
  key: KpiSpreadsheetColumnKey;
  label: string;
  shortLabel?: string;
  group: "calendar" | "fr" | "referral" | "office" | "d2d";
  kind: "meta" | "input" | "derived";
  format: "text" | "integer" | "currency" | "percentage";
  editable: boolean;
  width: number;
  description?: string;
};

export type KpiSpreadsheetGroup = {
  key: KpiSpreadsheetColumn["group"];
  label: string;
  accentClass: string;
  borderClass: string;
};

export const KPI_SPREADSHEET_GROUPS: KpiSpreadsheetGroup[] = [
  {
    key: "calendar",
    label: "Calendario",
    accentClass: "bg-slate-100 text-slate-700",
    borderClass: "border-slate-200"
  },
  {
    key: "fr",
    label: "FR",
    accentClass: "bg-blue-600 text-white",
    borderClass: "border-blue-200"
  },
  {
    key: "referral",
    label: "Referenze",
    accentClass: "bg-amber-500 text-white",
    borderClass: "border-amber-200"
  },
  {
    key: "office",
    label: "Ufficio",
    accentClass: "bg-violet-600 text-white",
    borderClass: "border-violet-200"
  },
  {
    key: "d2d",
    label: "D2D",
    accentClass: "bg-fuchsia-600 text-white",
    borderClass: "border-fuchsia-200"
  }
];

export const KPI_SPREADSHEET_COLUMNS: KpiSpreadsheetColumn[] = [
  {
    key: "calendar",
    label: "Giorno",
    group: "calendar",
    kind: "meta",
    format: "text",
    editable: false,
    width: 82,
    description: "Data nel formato DD-MM."
  },
  {
    key: "frCalls",
    label: "Chiamate",
    group: "fr",
    kind: "input",
    format: "integer",
    editable: true,
    width: 108
  },
  {
    key: "frNotInterested",
    label: "Non interessati",
    group: "fr",
    kind: "input",
    format: "integer",
    editable: true,
    width: 122
  },
  {
    key: "frNoAnswer",
    label: "NR",
    group: "fr",
    kind: "input",
    format: "integer",
    editable: true,
    width: 88
  },
  {
    key: "frAppointments",
    label: "App presi",
    group: "fr",
    kind: "input",
    format: "integer",
    editable: true,
    width: 108
  },
  {
    key: "frCompleted",
    label: "Svolti",
    group: "fr",
    kind: "input",
    format: "integer",
    editable: true,
    width: 92
  },
  {
    key: "frNoShow",
    label: "No show",
    group: "fr",
    kind: "input",
    format: "integer",
    editable: true,
    width: 92
  },
  {
    key: "frClosed",
    label: "Chiusi",
    group: "fr",
    kind: "input",
    format: "integer",
    editable: true,
    width: 92
  },
  {
    key: "frRevenue",
    label: "Soldi",
    group: "fr",
    kind: "input",
    format: "currency",
    editable: true,
    width: 118
  },
  {
    key: "frContacts",
    label: "Contatti FR",
    group: "fr",
    kind: "derived",
    format: "integer",
    editable: false,
    width: 110,
    description: "Chiamate - Non interessati - NR"
  },
  {
    key: "frAppointmentsConversionRate",
    label: "Conv. app",
    group: "fr",
    kind: "derived",
    format: "percentage",
    editable: false,
    width: 106
  },
  {
    key: "frShowUpRate",
    label: "Show-up",
    group: "fr",
    kind: "derived",
    format: "percentage",
    editable: false,
    width: 96
  },
  {
    key: "frClosingRate",
    label: "Closing",
    group: "fr",
    kind: "derived",
    format: "percentage",
    editable: false,
    width: 96
  },
  {
    key: "frAverageTicket",
    label: "Ticket medio",
    group: "fr",
    kind: "derived",
    format: "currency",
    editable: false,
    width: 118
  },
  {
    key: "referralCount",
    label: "Referenze",
    group: "referral",
    kind: "input",
    format: "integer",
    editable: true,
    width: 104
  },
  {
    key: "referralClosed",
    label: "Chiusi ref.",
    group: "referral",
    kind: "input",
    format: "integer",
    editable: true,
    width: 108
  },
  {
    key: "referralRevenue",
    label: "Soldi ref.",
    group: "referral",
    kind: "input",
    format: "currency",
    editable: true,
    width: 118
  },
  {
    key: "officeBase",
    label: "Ufficio",
    group: "office",
    kind: "input",
    format: "integer",
    editable: true,
    width: 102
  },
  {
    key: "officeCompleted",
    label: "Ufficio svolti",
    group: "office",
    kind: "input",
    format: "integer",
    editable: true,
    width: 122
  },
  {
    key: "officeRescheduled",
    label: "Rifissato",
    group: "office",
    kind: "input",
    format: "integer",
    editable: true,
    width: 108
  },
  {
    key: "officeNoShow",
    label: "No show ufficio",
    group: "office",
    kind: "input",
    format: "integer",
    editable: true,
    width: 124
  },
  {
    key: "officeClosed",
    label: "Chiusi ufficio",
    group: "office",
    kind: "input",
    format: "integer",
    editable: true,
    width: 120
  },
  {
    key: "officeRevenue",
    label: "Soldi ufficio",
    group: "office",
    kind: "input",
    format: "currency",
    editable: true,
    width: 124
  },
  {
    key: "officeShowUpRate",
    label: "Show-up uff.",
    group: "office",
    kind: "derived",
    format: "percentage",
    editable: false,
    width: 118
  },
  {
    key: "officeClosingRate",
    label: "Closing uff.",
    group: "office",
    kind: "derived",
    format: "percentage",
    editable: false,
    width: 114
  },
  {
    key: "officeAverageTicket",
    label: "Ticket medio uff.",
    group: "office",
    kind: "derived",
    format: "currency",
    editable: false,
    width: 130
  },
  {
    key: "d2dBase",
    label: "D2D",
    group: "d2d",
    kind: "input",
    format: "integer",
    editable: true,
    width: 92
  },
  {
    key: "d2dAppointments",
    label: "App D2D",
    group: "d2d",
    kind: "input",
    format: "integer",
    editable: true,
    width: 98
  },
  {
    key: "d2dCompleted",
    label: "Svolti D2D",
    group: "d2d",
    kind: "input",
    format: "integer",
    editable: true,
    width: 106
  },
  {
    key: "d2dNoShow",
    label: "No show D2D",
    group: "d2d",
    kind: "input",
    format: "integer",
    editable: true,
    width: 112
  },
  {
    key: "d2dClosed",
    label: "Chiusi D2D",
    group: "d2d",
    kind: "input",
    format: "integer",
    editable: true,
    width: 102
  },
  {
    key: "d2dRevenue",
    label: "Soldi D2D",
    group: "d2d",
    kind: "input",
    format: "currency",
    editable: true,
    width: 118
  },
  {
    key: "d2dShowUpRate",
    label: "Show-up D2D",
    group: "d2d",
    kind: "derived",
    format: "percentage",
    editable: false,
    width: 116
  },
  {
    key: "d2dClosingRate",
    label: "Closing D2D",
    group: "d2d",
    kind: "derived",
    format: "percentage",
    editable: false,
    width: 116
  },
  {
    key: "d2dAverageTicket",
    label: "Ticket medio D2D",
    group: "d2d",
    kind: "derived",
    format: "currency",
    editable: false,
    width: 136
  }
];

export function getSpreadsheetColumnByKey(key: KpiSpreadsheetColumnKey) {
  return KPI_SPREADSHEET_COLUMNS.find((column) => column.key === key);
}

export function isEditableSpreadsheetColumn(column: KpiSpreadsheetColumn) {
  return column.kind === "input" && column.editable;
}
