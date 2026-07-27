export type KpiDataSource = "google_sheets" | "internal_supabase";

export type AppRole = "admin" | "seller";

export type SellerAccountStatus =
  | "pending_invite"
  | "active"
  | "suspended"
  | "disabled";

export type ReportingPeriodStatus = "open" | "locked";

export type InternalKpiSource = "manual" | "google_sheets_import" | "migration";

export type DayType = "FERIALE" | "SAB" | "DOM";

export type ValidationSeverity = "warning" | "error";

export type ValidationStatus = "valid" | "warning" | "error";

export type InternalKpiSaveState =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "error";

export type InternalKpiInputFieldKey =
  | "frCalls"
  | "frNotInterested"
  | "frNoAnswer"
  | "frAppointments"
  | "frCompleted"
  | "frNoShow"
  | "frClosed"
  | "frRevenue"
  | "referralCount"
  | "referralClosed"
  | "referralRevenue"
  | "d2dBase"
  | "d2dAppointments"
  | "d2dCompleted"
  | "d2dNoShow"
  | "d2dClosed"
  | "d2dRevenue"
  | "officeBase"
  | "officeCompleted"
  | "officeRescheduled"
  | "officeNoShow"
  | "officeClosed"
  | "officeRevenue";

export type InternalKpiDerivedFieldKey =
  | "frContacts"
  | "frContactRate"
  | "frNotInterestedRate"
  | "frNoAnswerRate"
  | "frAppointmentsConversionRate"
  | "frShowUpRate"
  | "frNoShowRate"
  | "frClosingRate"
  | "frAverageTicket"
  | "referralConversionRate"
  | "referralAverageValue"
  | "referralAverageTicket"
  | "d2dAppointmentsConversionRate"
  | "d2dShowUpRate"
  | "d2dNoShowRate"
  | "d2dClosingRate"
  | "d2dAverageTicket"
  | "officeShowUpRate"
  | "officeNoShowRate"
  | "officeClosingRate"
  | "officeRecoveryRate"
  | "officeAverageTicket";

export type InternalKpiFieldKey =
  | InternalKpiInputFieldKey
  | InternalKpiDerivedFieldKey;

export type InternalKpiValidationCode =
  | "NEGATIVE_CONTACTS"
  | "FR_COMPLETED_GT_APPOINTMENTS"
  | "FR_NO_SHOW_GT_APPOINTMENTS"
  | "FR_OUTCOMES_GT_APPOINTMENTS"
  | "FR_CLOSED_GT_COMPLETED"
  | "FR_REVENUE_WITHOUT_CLOSED"
  | "REFERRAL_CLOSED_GT_TOTAL"
  | "REFERRAL_REVENUE_WITHOUT_CLOSED"
  | "D2D_APPOINTMENTS_GT_BASE"
  | "D2D_COMPLETED_GT_APPOINTMENTS"
  | "D2D_NO_SHOW_GT_APPOINTMENTS"
  | "D2D_OUTCOMES_GT_APPOINTMENTS"
  | "D2D_CLOSED_GT_COMPLETED"
  | "D2D_REVENUE_WITHOUT_CLOSED"
  | "OFFICE_COMPLETED_GT_BASE"
  | "OFFICE_NO_SHOW_GT_BASE"
  | "OFFICE_OUTCOMES_GT_BASE"
  | "OFFICE_CLOSED_GT_COMPLETED"
  | "OFFICE_RESCHEDULED_GT_NO_SHOW"
  | "OFFICE_REVENUE_WITHOUT_CLOSED";

export type InternalKpiValidationError = {
  code: InternalKpiValidationCode;
  message: string;
  severity: ValidationSeverity;
  fieldKeys: InternalKpiFieldKey[];
};

export type AppUserProfile = {
  id: string;
  role: AppRole;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SellerIdentity = {
  sellerId: string;
  profileId: string | null;
  legacyName: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  isActive: boolean;
  status: SellerAccountStatus | null;
  lastLoginAt: string | null;
};

export type SellerReportingPeriod = {
  id: string;
  sellerId: string;
  year: number;
  month: number;
  status: ReportingPeriodStatus;
  source: InternalKpiSource;
  createdBy: string | null;
  lockedAt: string | null;
  lockedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InternalKpiRowInput = {
  reportDate: string;
  dayNumber: number;
  dayType: DayType;
  frCalls: number;
  frNotInterested: number;
  frNoAnswer: number;
  frAppointments: number;
  frCompleted: number;
  frNoShow: number;
  frClosed: number;
  frRevenue: number;
  referralCount: number;
  referralClosed: number;
  referralRevenue: number;
  d2dBase: number;
  d2dAppointments: number;
  d2dCompleted: number;
  d2dNoShow: number;
  d2dClosed: number;
  d2dRevenue: number;
  officeBase: number;
  officeCompleted: number;
  officeRescheduled: number;
  officeNoShow: number;
  officeClosed: number;
  officeRevenue: number;
};

export type InternalKpiRowDerived = {
  frContacts: number;
  frContactRate: number;
  frNotInterestedRate: number;
  frNoAnswerRate: number;
  frAppointmentsConversionRate: number;
  frShowUpRate: number;
  frNoShowRate: number;
  frClosingRate: number;
  frAverageTicket: number;
  referralConversionRate: number;
  referralAverageValue: number;
  referralAverageTicket: number;
  d2dAppointmentsConversionRate: number;
  d2dShowUpRate: number;
  d2dNoShowRate: number;
  d2dClosingRate: number;
  d2dAverageTicket: number;
  officeShowUpRate: number;
  officeNoShowRate: number;
  officeClosingRate: number;
  officeRecoveryRate: number;
  officeAverageTicket: number;
};

export type InternalKpiRowValidation = {
  status: ValidationStatus;
  errors: InternalKpiValidationError[];
};

export type InternalKpiDailyRow = {
  id?: string;
  reportingPeriodId?: string;
  sellerId?: string;
  source: InternalKpiSource;
  updatedAt?: string;
  updatedBy?: string | null;
  input: InternalKpiRowInput;
  derived: InternalKpiRowDerived;
  validation: InternalKpiRowValidation;
};

export type InternalKpiPeriodSummary = {
  activeDays: number;
  total: {
    input: InternalKpiRowInput;
    derived: InternalKpiRowDerived;
    validation: InternalKpiRowValidation;
  };
  averagePerActiveDay: {
    input: InternalKpiRowInput;
    derived: InternalKpiRowDerived;
    validation: InternalKpiRowValidation;
  };
};

export type InternalKpiNormalizedPeriodData = {
  sellerId: string;
  period: {
    year: number;
    month: number;
  };
  source: KpiDataSource;
  dailyRows: InternalKpiDailyRow[];
  totals: InternalKpiPeriodSummary["total"];
  averagePerActiveDay: InternalKpiPeriodSummary["averagePerActiveDay"];
  activeDays: number;
};
