import { deriveInternalKpiRow } from "@/lib/internal-kpi/formulas";
import {
  InternalKpiDailyRow,
  InternalKpiRowInput,
  ReportingPeriodStatus
} from "@/lib/internal-kpi/types";
import { internalKpiRowInputSchema } from "@/lib/internal-kpi/schemas";
import { NormalizedSalesRow } from "@/lib/types";

type SupabaseLikeClient = {
  from: (table: string) => any;
};

type SellerPeriodRowRecord = {
  id: string;
  reporting_period_id: string;
  seller_id: string;
  report_date: string;
  day_number: number;
  day_type: "FERIALE" | "SAB" | "DOM";
  fr_calls: number;
  fr_not_interested: number;
  fr_no_answer: number;
  fr_appointments: number;
  fr_completed: number;
  fr_no_show: number;
  fr_closed: number;
  fr_revenue: number | string;
  referral_count: number;
  referral_closed: number;
  referral_revenue: number | string;
  d2d_base: number;
  d2d_appointments: number;
  d2d_completed: number;
  d2d_no_show: number;
  d2d_closed: number;
  d2d_revenue: number | string;
  office_base: number;
  office_completed: number;
  office_rescheduled: number;
  office_no_show: number;
  office_closed: number;
  office_revenue: number | string;
  validation_status: "valid" | "warning" | "error";
  validation_errors: unknown[];
  source: "manual" | "google_sheets_import" | "migration";
  updated_at?: string;
  updated_by?: string | null;
};

type SellerPeriodRecord = {
  id: string;
  seller_id: string;
  year: number;
  month: number;
  status: ReportingPeriodStatus;
  source: "manual" | "google_sheets_import" | "migration";
};

type DashboardKpiRowRecord = SellerPeriodRowRecord & {
  seller_id: string;
};

function getDayType(date: Date): "FERIALE" | "SAB" | "DOM" {
  const day = date.getDay();

  if (day === 0) {
    return "DOM";
  }

  if (day === 6) {
    return "SAB";
  }

  return "FERIALE";
}

function createBaseInput(date: Date): InternalKpiRowInput {
  const reportDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

  return {
    reportDate,
    dayNumber: date.getDate(),
    dayType: getDayType(date),
    frCalls: 0,
    frNotInterested: 0,
    frNoAnswer: 0,
    frAppointments: 0,
    frCompleted: 0,
    frNoShow: 0,
    frClosed: 0,
    frRevenue: 0,
    referralCount: 0,
    referralClosed: 0,
    referralRevenue: 0,
    d2dBase: 0,
    d2dAppointments: 0,
    d2dCompleted: 0,
    d2dNoShow: 0,
    d2dClosed: 0,
    d2dRevenue: 0,
    officeBase: 0,
    officeCompleted: 0,
    officeRescheduled: 0,
    officeNoShow: 0,
    officeClosed: 0,
    officeRevenue: 0
  };
}

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

export function buildBaseSpreadsheetRows(year: number, month: number): InternalKpiDailyRow[] {
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const input = createBaseInput(new Date(year, month - 1, index + 1));
    const derivedRow = deriveInternalKpiRow(input);

    return {
      source: "manual",
      input,
      derived: derivedRow.derived,
      validation: derivedRow.validation
    };
  });
}

function mapDbRowToInternalRow(record: SellerPeriodRowRecord): InternalKpiDailyRow {
  const input: InternalKpiRowInput = {
    reportDate: record.report_date,
    dayNumber: record.day_number,
    dayType: record.day_type,
    frCalls: record.fr_calls,
    frNotInterested: record.fr_not_interested,
    frNoAnswer: record.fr_no_answer,
    frAppointments: record.fr_appointments,
    frCompleted: record.fr_completed,
    frNoShow: record.fr_no_show,
    frClosed: record.fr_closed,
    frRevenue: toNumber(record.fr_revenue),
    referralCount: record.referral_count,
    referralClosed: record.referral_closed,
    referralRevenue: toNumber(record.referral_revenue),
    d2dBase: record.d2d_base,
    d2dAppointments: record.d2d_appointments,
    d2dCompleted: record.d2d_completed,
    d2dNoShow: record.d2d_no_show,
    d2dClosed: record.d2d_closed,
    d2dRevenue: toNumber(record.d2d_revenue),
    officeBase: record.office_base,
    officeCompleted: record.office_completed,
    officeRescheduled: record.office_rescheduled,
    officeNoShow: record.office_no_show,
    officeClosed: record.office_closed,
    officeRevenue: toNumber(record.office_revenue)
  };
  const derivedRow = deriveInternalKpiRow(input);

  return {
    id: record.id,
    reportingPeriodId: record.reporting_period_id,
    sellerId: record.seller_id,
    source: record.source,
    updatedAt: record.updated_at,
    updatedBy: record.updated_by ?? null,
    input,
    derived: derivedRow.derived,
    validation: derivedRow.validation
  };
}

function mapInternalRowToDashboardRow(row: SellerPeriodRowRecord, sellerName: string): NormalizedSalesRow {
  const revenueFr = toNumber(row.fr_revenue);
  const revenueD2d = toNumber(row.d2d_revenue);
  const revenueOffice = toNumber(row.office_revenue);
  const revenueReferenze = toNumber(row.referral_revenue);
  const contactsFr = Math.max(0, row.fr_calls - row.fr_not_interested - row.fr_no_answer);

  return {
    date: row.report_date,
    type: row.day_type,
    seller: sellerName,
    callsFr: row.fr_calls,
    notInterestedFr: row.fr_not_interested,
    nrFr: row.fr_no_answer,
    appointmentsBookedFr: row.fr_appointments,
    appointmentsDoneFr: row.fr_completed,
    noShowFr: row.fr_no_show,
    closedFr: row.fr_closed,
    revenueFr,
    contactsFr,
    d2dBase: row.d2d_base,
    appointmentsBookedD2d: row.d2d_appointments,
    appointmentsDoneD2d: row.d2d_completed,
    noShowD2d: row.d2d_no_show,
    closedD2d: row.d2d_closed,
    revenueD2d,
    officeBase: row.office_base,
    appointmentsDoneOffice: row.office_completed,
    noShowOffice: row.office_no_show,
    closedOffice: row.office_closed,
    revenueOffice,
    rifissatoOffice: row.office_rescheduled,
    referenze: row.referral_count,
    closedReferenze: row.referral_closed,
    revenueReferenze,
    calls: row.fr_calls,
    appointmentsBooked: row.fr_appointments,
    appointmentsDone: row.fr_completed,
    dealsClosed: row.fr_closed,
    revenue: revenueFr,
    sourceSheet: "internal_supabase",
    spreadsheetId: row.seller_id
  };
}

async function getReportingPeriod(
  supabase: SupabaseLikeClient,
  sellerId: string,
  year: number,
  month: number
) {
  const { data, error } = await supabase
    .from("seller_reporting_periods")
    .select("id,seller_id,year,month,status,source")
    .eq("seller_id", sellerId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function ensureReportingPeriod(
  supabase: SupabaseLikeClient,
  sellerId: string,
  year: number,
  month: number
) {
  const existing = await getReportingPeriod(supabase, sellerId, year, month);

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("seller_reporting_periods")
    .insert({
      seller_id: sellerId,
      year,
      month,
      source: "manual"
    })
    .select("id,seller_id,year,month,status,source")
    .single();

  if (error) {
    throw error;
  }

  return data as SellerPeriodRecord;
}

export async function loadSellerPeriodRows(
  supabase: SupabaseLikeClient,
  sellerId: string,
  year: number,
  month: number
) {
  const period = await getReportingPeriod(supabase, sellerId, year, month);
  const baseRows = buildBaseSpreadsheetRows(year, month);

  if (!period) {
    return {
      reportingPeriodId: null,
      status: "open" as ReportingPeriodStatus,
      rows: baseRows
    };
  }

  const { data, error } = await supabase
    .from("seller_daily_kpis")
    .select("*")
    .eq("reporting_period_id", period.id)
    .order("report_date", { ascending: true });

  if (error) {
    throw error;
  }

  const rowsByDate = new Map(
    ((data ?? []) as SellerPeriodRowRecord[]).map((row) => [row.report_date, mapDbRowToInternalRow(row)])
  );

  const rows = baseRows.map((row) => rowsByDate.get(row.input.reportDate) ?? row);

  return {
    reportingPeriodId: period.id,
    status: period.status,
    rows
  };
}

export async function saveSellerPeriodRows(
  supabase: SupabaseLikeClient,
  params: {
    sellerId: string;
    year: number;
    month: number;
    actorUserId: string;
    rows: InternalKpiRowInput[];
  }
) {
  const period = await ensureReportingPeriod(supabase, params.sellerId, params.year, params.month);

  if (period.status !== "open") {
    throw new Error("Il periodo selezionato e chiuso e non puo essere modificato.");
  }

  const payload = params.rows.map((rawRow) => {
    const input = internalKpiRowInputSchema.parse(rawRow);
    const derivedRow = deriveInternalKpiRow(input);

    return {
      reporting_period_id: period.id,
      seller_id: params.sellerId,
      report_date: input.reportDate,
      day_number: input.dayNumber,
      day_type: input.dayType,
      fr_calls: input.frCalls,
      fr_not_interested: input.frNotInterested,
      fr_no_answer: input.frNoAnswer,
      fr_appointments: input.frAppointments,
      fr_completed: input.frCompleted,
      fr_no_show: input.frNoShow,
      fr_closed: input.frClosed,
      fr_revenue: input.frRevenue,
      referral_count: input.referralCount,
      referral_closed: input.referralClosed,
      referral_revenue: input.referralRevenue,
      d2d_base: input.d2dBase,
      d2d_appointments: input.d2dAppointments,
      d2d_completed: input.d2dCompleted,
      d2d_no_show: input.d2dNoShow,
      d2d_closed: input.d2dClosed,
      d2d_revenue: input.d2dRevenue,
      office_base: input.officeBase,
      office_completed: input.officeCompleted,
      office_rescheduled: input.officeRescheduled,
      office_no_show: input.officeNoShow,
      office_closed: input.officeClosed,
      office_revenue: input.officeRevenue,
      validation_status: derivedRow.validation.status,
      validation_errors: derivedRow.validation.errors,
      source: "manual",
      updated_by: params.actorUserId
    };
  });

  const { error } = await supabase.from("seller_daily_kpis").upsert(payload, {
    onConflict: "reporting_period_id,report_date"
  });

  if (error) {
    throw error;
  }

  return period;
}

export async function loadDashboardRows(
  supabase: SupabaseLikeClient,
  params: {
    startDate: string;
    endDate: string;
    sellerIds?: string[];
    sellerNamesById?: Map<string, string>;
  }
) {
  if (params.sellerIds && params.sellerIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("seller_daily_kpis")
    .select(
      [
        "seller_id",
        "report_date",
        "day_type",
        "fr_calls",
        "fr_not_interested",
        "fr_no_answer",
        "fr_appointments",
        "fr_completed",
        "fr_no_show",
        "fr_closed",
        "fr_revenue",
        "referral_count",
        "referral_closed",
        "referral_revenue",
        "d2d_base",
        "d2d_appointments",
        "d2d_completed",
        "d2d_no_show",
        "d2d_closed",
        "d2d_revenue",
        "office_base",
        "office_completed",
        "office_rescheduled",
        "office_no_show",
        "office_closed",
        "office_revenue"
      ].join(",")
    )
    .gte("report_date", params.startDate)
    .lte("report_date", params.endDate)
    .order("report_date", { ascending: true });

  if (params.sellerIds?.length) {
    query = query.in("seller_id", params.sellerIds);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const sellerNamesById = params.sellerNamesById ?? new Map<string, string>();

  return ((data ?? []) as DashboardKpiRowRecord[])
    .map((row) => {
      const sellerName = sellerNamesById.get(row.seller_id);

      if (!sellerName) {
        return null;
      }

      return mapInternalRowToDashboardRow(row, sellerName);
    })
    .filter((row): row is NormalizedSalesRow => row !== null);
}
