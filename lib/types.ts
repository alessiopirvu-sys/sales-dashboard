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
};

export type TimePreset = "today" | "week" | "month" | "custom";

export type DashboardFilters = {
  preset: TimePreset;
  seller: string;
  startDate?: string;
  endDate?: string;
};

export type SummaryMetrics = {
  calls: number;
  appointmentsBooked: number;
  appointmentsDone: number;
  dealsClosed: number;
  revenue: number;
  averageTicket: number;
  conversionRate: number;
  showUpRate: number;
  closingRate: number;
};

export type RankingRow = SummaryMetrics & {
  seller: string;
};

export type TrendPoint = {
  date: string;
  label: string;
  calls: number;
  revenue: number;
};

export type DashboardResponse = {
  summary: SummaryMetrics;
  ranking: RankingRow[];
  trend: TrendPoint[];
  comparison: {
    current: Pick<SummaryMetrics, "revenue" | "dealsClosed" | "closingRate">;
    previous: Pick<SummaryMetrics, "revenue" | "dealsClosed" | "closingRate">;
  };
  meta: {
    lastUpdated: string;
    source: SheetsReadMode | "multi" | "mock";
    availableSellers: string[];
    totalRows: number;
  };
};

export type SellerRecord = {
  id: string;
  name: string;
  sheet_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SellerInput = {
  name: string;
  sheetUrl: string;
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
