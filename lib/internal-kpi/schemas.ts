import { z } from "zod";

const integerLikeField = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }

  return value;
}, z.number().int().min(0));

const currencyField = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }

  return value;
}, z.number().min(0).refine((value) => Number.isInteger(value * 100), {
  message: "Il valore monetario puo avere al massimo due decimali."
}));

export const appRoleSchema = z.enum(["admin", "seller"]);

export const sellerAccountStatusSchema = z.enum([
  "pending_invite",
  "active",
  "suspended",
  "disabled"
]);

export const reportingPeriodStatusSchema = z.enum(["open", "locked"]);

export const internalKpiSourceSchema = z.enum([
  "manual",
  "google_sheets_import",
  "migration"
]);

export const dayTypeSchema = z.enum(["FERIALE", "SAB", "DOM"]);

export const validationSeveritySchema = z.enum(["warning", "error"]);

export const validationStatusSchema = z.enum(["valid", "warning", "error"]);

export const internalKpiSaveStateSchema = z.enum([
  "idle",
  "dirty",
  "saving",
  "saved",
  "error"
]);

export const appUserProfileSchema = z.object({
  id: z.string().uuid(),
  role: appRoleSchema,
  firstName: z.string().trim().min(1).nullable(),
  lastName: z.string().trim().min(1).nullable(),
  email: z.string().email().nullable(),
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
}).strict();

export const sellerIdentitySchema = z.object({
  sellerId: z.string().uuid(),
  profileId: z.string().uuid().nullable(),
  legacyName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  firstName: z.string().trim().min(1).nullable(),
  lastName: z.string().trim().min(1).nullable(),
  email: z.string().email().nullable(),
  isActive: z.boolean(),
  status: sellerAccountStatusSchema.nullable(),
  lastLoginAt: z.string().datetime().nullable()
}).strict();

export const sellerInvitePayloadSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().email(),
  role: z.literal("seller")
}).strict();

export const reportingPeriodCreateSchema = z.object({
  sellerId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  source: internalKpiSourceSchema.default("manual")
}).strict();

export const internalKpiRowInputSchema = z.object({
  reportDate: z.string().date(),
  dayNumber: z.number().int().min(1).max(31),
  dayType: dayTypeSchema,
  frCalls: integerLikeField,
  frNotInterested: integerLikeField,
  frNoAnswer: integerLikeField,
  frAppointments: integerLikeField,
  frCompleted: integerLikeField,
  frNoShow: integerLikeField,
  frClosed: integerLikeField,
  frRevenue: currencyField,
  referralCount: integerLikeField,
  referralClosed: integerLikeField,
  referralRevenue: currencyField,
  d2dBase: integerLikeField,
  d2dAppointments: integerLikeField,
  d2dCompleted: integerLikeField,
  d2dNoShow: integerLikeField,
  d2dClosed: integerLikeField,
  d2dRevenue: currencyField,
  officeBase: integerLikeField,
  officeCompleted: integerLikeField,
  officeRescheduled: integerLikeField,
  officeNoShow: integerLikeField,
  officeClosed: integerLikeField,
  officeRevenue: currencyField
}).strict();

export const internalKpiValidationErrorSchema = z.object({
  code: z.enum([
    "NEGATIVE_CONTACTS",
    "FR_COMPLETED_GT_APPOINTMENTS",
    "FR_NO_SHOW_GT_APPOINTMENTS",
    "FR_OUTCOMES_GT_APPOINTMENTS",
    "FR_CLOSED_GT_COMPLETED",
    "FR_REVENUE_WITHOUT_CLOSED",
    "REFERRAL_CLOSED_GT_TOTAL",
    "REFERRAL_REVENUE_WITHOUT_CLOSED",
    "D2D_APPOINTMENTS_GT_BASE",
    "D2D_COMPLETED_GT_APPOINTMENTS",
    "D2D_NO_SHOW_GT_APPOINTMENTS",
    "D2D_OUTCOMES_GT_APPOINTMENTS",
    "D2D_CLOSED_GT_COMPLETED",
    "D2D_REVENUE_WITHOUT_CLOSED",
    "OFFICE_COMPLETED_GT_BASE",
    "OFFICE_NO_SHOW_GT_BASE",
    "OFFICE_OUTCOMES_GT_BASE",
    "OFFICE_CLOSED_GT_COMPLETED",
    "OFFICE_RESCHEDULED_GT_NO_SHOW",
    "OFFICE_REVENUE_WITHOUT_CLOSED"
  ]),
  message: z.string().min(1),
  severity: validationSeveritySchema,
  fieldKeys: z.array(z.string().min(1)).min(1)
}).strict();

export const sellerDailyKpiUpsertSchema = z.object({
  reportingPeriodId: z.string().uuid(),
  sellerId: z.string().uuid(),
  source: internalKpiSourceSchema.default("manual"),
  input: internalKpiRowInputSchema
}).strict();

export const periodLockPayloadSchema = z.object({
  reportingPeriodId: z.string().uuid(),
  status: reportingPeriodStatusSchema
}).strict();

export const importRunRequestSchema = z.object({
  sellerId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  source: internalKpiSourceSchema.default("google_sheets_import"),
  dryRun: z.boolean().default(true)
}).strict();

export type AppUserProfileSchema = z.infer<typeof appUserProfileSchema>;
export type SellerIdentitySchema = z.infer<typeof sellerIdentitySchema>;
export type SellerInvitePayloadSchema = z.infer<typeof sellerInvitePayloadSchema>;
export type ReportingPeriodCreateSchema = z.infer<typeof reportingPeriodCreateSchema>;
export type InternalKpiRowInputSchema = z.infer<typeof internalKpiRowInputSchema>;
export type SellerDailyKpiUpsertSchema = z.infer<typeof sellerDailyKpiUpsertSchema>;
