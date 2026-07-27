export type SheetColumnMapping = {
  date: string;
  type: string;
  callsFr: string;
  notInterestedFr: string;
  nrFr: string;
  appointmentsBookedFr: string;
  appointmentsDoneFr: string;
  noShowFr: string;
  closedFr: string;
  revenueFr: string;
  contactsFr: string;
  d2dBase: string;
  appointmentsBookedD2d: string;
  appointmentsDoneD2d: string;
  noShowD2d: string;
  closedD2d: string;
  revenueD2d: string;
  officeBase: string;
  appointmentsDoneOffice: string;
  noShowOffice: string;
  closedOffice: string;
  revenueOffice: string;
  rifissatoOffice: string;
  referenze: string;
  closedReferenze: string;
  revenueReferenze: string;
};

export type SheetsReadMode = "csv_public" | "google_api";

export type SheetSourceConfig = {
  spreadsheetId: string;
  sheetName: string;
  sellerName: string;
  publishedCsvUrl?: string;
  columns: SheetColumnMapping;
};

export type RawSheetRow = Record<string, string | number | null | undefined>;

export type NormalizedSalesRow = {
  date: string;
  type: string;
  seller: string;
  callsFr: number;
  notInterestedFr: number;
  nrFr: number;
  appointmentsBookedFr: number;
  appointmentsDoneFr: number;
  noShowFr: number;
  closedFr: number;
  revenueFr: number;
  contactsFr: number;
  d2dBase: number;
  appointmentsBookedD2d: number;
  appointmentsDoneD2d: number;
  noShowD2d: number;
  closedD2d: number;
  revenueD2d: number;
  officeBase: number;
  appointmentsDoneOffice: number;
  noShowOffice: number;
  closedOffice: number;
  revenueOffice: number;
  rifissatoOffice: number;
  referenze: number;
  closedReferenze: number;
  revenueReferenze: number;
  calls: number;
  appointmentsBooked: number;
  appointmentsDone: number;
  dealsClosed: number;
  revenue: number;
  sourceSheet: string;
  spreadsheetId: string;
};

export type AggregatedSalesPeriod = Omit<NormalizedSalesRow, "date" | "seller" | "type" | "sourceSheet" | "spreadsheetId"> & {
  rowsCount: number;
};

export type CalculatedSalesKpis = {
  fr: {
    contactRate: number;
    nrRate: number;
    appointmentsConversionRate: number;
    showUpRate: number;
    noShowRate: number;
    closingRate: number;
    averageTicket: number;
  };
  d2d: {
    showUpRateD2d: number;
    closingRateD2d: number;
  };
  office: {
    showUpRateOffice: number;
    closingRateOffice: number;
  };
  referenze: {
    conversionRateReferenze: number;
    averageValueReferenze: number;
    averageClosedValueReferenze: number;
    incidenzaReferenze: number;
  };
};

export type TimePreset = "today" | "week" | "month" | "custom";

export type DashboardFilters = {
  preset: TimePreset;
  seller: string;
  startDate?: string;
  endDate?: string;
};

export type SellerSheetsMap = Record<string, string>;

export type SellerSheetEntry = {
  key: string;
  year: number;
  month: number;
  label: string;
  url: string;
};

export type SummaryMetrics = {
  /* ── Funnel freddi (FR only) ── */
  calls: number;
  appointmentsBooked: number;
  appointmentsDone: number;
  dealsClosed: number;
  revenue: number;
  averageTicket: number;
  conversionRate: number;
  showUpRate: number;
  closingRate: number;
  /* ── Referenze ── */
  referenze: number;
  closedReferenze: number;
  revenueReferenze: number;
  conversionRateReferenze: number;
  averageValueReferenze: number;
  averageTicketReferenze: number;
  /* ── Ufficio ── */
  officeBase: number;
  appointmentsDoneOffice: number;
  noShowOffice: number;
  closedOffice: number;
  revenueOffice: number;
  showUpRateOffice: number;
  noShowRateOffice: number;
  closingRateOffice: number;
  averageTicketOffice: number;
  rifissatoOffice: number;
  recoveryRateOffice: number;
  /* ── Totali business (FR + Referenze + Ufficio) ── */
  dealsClosedTotal: number;
  revenueTotal: number;
  averageTicketTotal: number;
};

export type RankingRow = SummaryMetrics & {
  seller: string;
};

export type TrendPoint = {
  date: string;
  label: string;
  calls: number;
  appointmentsBooked: number;
  appointmentsDone: number;
  dealsClosed: number;
  showUpRate: number;
  closingRate: number;
  revenue: number;
  revenueFr: number;
  revenueReferenze: number;
  revenueOffice: number;
};

export type SellerDailyPoint = {
  seller: string;
  date: string;
  label: string;
  calls: number;
  appointmentsBooked: number;
  appointmentsDone: number;
  dealsClosed: number;
  revenueTotal: number;
  showUpRate: number;
  closingRate: number;
  conversionRate: number;
};

export type DashboardResponse = {
  summary: SummaryMetrics;
  ranking: RankingRow[];
  trend: TrendPoint[];
  comparison: {
    current: Pick<SummaryMetrics, "revenueTotal" | "dealsClosedTotal" | "closingRate">;
    previous: Pick<SummaryMetrics, "revenueTotal" | "dealsClosedTotal" | "closingRate">;
  };
  meta: {
    lastUpdated: string;
    source: SheetsReadMode | "multi" | "mock" | "internal_supabase";
    availableSellers: string[];
    totalRows: number;
  };
  channelKpis?: CalculatedSalesKpis;
  sellerBreakdown?: SellerDashboardBreakdown[];
  sellerDailyTrend?: SellerDailyPoint[];
};

export type SellerRecord = {
  id: string;
  name: string;
  sheet_url: string | null;
  sheets: SellerSheetsMap | null;
  sheet_url_april: string | null;
  sheet_url_may: string | null;
  is_active: boolean;
  profile_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  status?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type SellerInput = {
  name: string;
  sheetUrl: string | null;
  sheets?: SellerSheetsMap;
};

export type SellerValidationResult = {
  valid: boolean;
  message: string;
  headers?: string[];
  missingHeaders?: string[];
};

export type SellerDashboardBreakdown = {
  seller: string;
  summary: SummaryMetrics;
  aggregated: AggregatedSalesPeriod;
  kpis: CalculatedSalesKpis;
};

export type SellerSheetDebug = {
  seller: string;
  sourceLabel: string;
  detectedHeaderRowIndex: number;
  detectedHeaders: string[];
  parsedRowCount: number;
  validRowCount: number;
  skippedRowCount: number;
  firstTwoNormalizedRows: Array<{
    date: string;
    seller: string;
    type: string;
    callsFr: number;
    appointmentsBookedFr: number;
    appointmentsDoneFr: number;
    closedFr: number;
    revenueFr: number;
  }>;
};

export type AssistantReplySource = "openai" | "fallback";

export type AssistantSectionTone = "neutral" | "positive" | "negative" | "action";

export type AssistantStructuredSection = {
  title: string;
  tone: AssistantSectionTone;
  items: string[];
};

export type AssistantStructuredMetric = {
  label: string;
  value: string;
  note?: string;
};

export type AssistantStructuredSellerRow = {
  seller: string;
  calls: string;
  booked: string;
  done: string;
  closed: string;
  closing: string;
  revenue: string;
};

export type AssistantStructuredReply = {
  headline: string;
  summary: string;
  sections: AssistantStructuredSection[];
  metrics: AssistantStructuredMetric[];
  sellerRows: AssistantStructuredSellerRow[];
};

export type AssistantReply = {
  answer: string;
  source: AssistantReplySource;
  model?: string;
  structured?: AssistantStructuredReply;
};
