import { describe, expect, it } from "vitest";

import {
  internalKpiRowInputSchema,
  reportingPeriodCreateSchema,
  sellerDailyKpiUpsertSchema
} from "../../lib/internal-kpi/schemas";

describe("internalKpiRowInputSchema", () => {
  const validBaseRow = {
    reportDate: "2026-07-01",
    dayNumber: 1,
    dayType: "FERIALE",
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

  it("accetta importi con due decimali", () => {
    const result = internalKpiRowInputSchema.parse({
      ...validBaseRow,
      frRevenue: "1234.56",
      officeRevenue: 88.5
    });

    expect(result.frRevenue).toBe(1234.56);
    expect(result.officeRevenue).toBe(88.5);
  });

  it("rifiuta importi con piu di due decimali", () => {
    const result = internalKpiRowInputSchema.safeParse({
      ...validBaseRow,
      frRevenue: 12.345
    });

    expect(result.success).toBe(false);
  });

  it("rifiuta valori negativi", () => {
    const result = internalKpiRowInputSchema.safeParse({
      ...validBaseRow,
      frCalls: -1
    });

    expect(result.success).toBe(false);
  });

  it("accetta valori molto grandi ma validi", () => {
    const result = internalKpiRowInputSchema.parse({
      ...validBaseRow,
      frCalls: 999999,
      frRevenue: 99999999.99
    });

    expect(result.frCalls).toBe(999999);
    expect(result.frRevenue).toBe(99999999.99);
  });

  it("rifiuta campi extra non previsti nel payload riga", () => {
    const result = internalKpiRowInputSchema.safeParse({
      ...validBaseRow,
      updatedBy: "fake-user"
    });

    expect(result.success).toBe(false);
  });
});

describe("reportingPeriodCreateSchema", () => {
  it("rifiuta mesi fuori range", () => {
    const result = reportingPeriodCreateSchema.safeParse({
      sellerId: "4dfde203-5d1b-47cf-aeb2-d9ffafaf5d0d",
      year: 2026,
      month: 13
    });

    expect(result.success).toBe(false);
  });
});

describe("sellerDailyKpiUpsertSchema", () => {
  it("rifiuta proprieta extra di sistema nel payload", () => {
    const result = sellerDailyKpiUpsertSchema.safeParse({
      reportingPeriodId: "4dfde203-5d1b-47cf-aeb2-d9ffafaf5d0d",
      sellerId: "c8b75695-717e-4692-88ba-44936784aa90",
      source: "manual",
      input: {
        reportDate: "2026-07-01",
        dayNumber: 1,
        dayType: "FERIALE",
        frCalls: 1,
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
      },
      updatedBy: "fake-user"
    });

    expect(result.success).toBe(false);
  });
});
