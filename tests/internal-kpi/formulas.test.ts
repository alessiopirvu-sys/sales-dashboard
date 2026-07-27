import { describe, expect, it } from "vitest";

import {
  buildInternalKpiPeriodSummary,
  deriveInternalKpiRow,
  findDuplicateReportDates,
  isInternalKpiActiveDay
} from "../../lib/internal-kpi/formulas";
import { InternalKpiRowInput } from "../../lib/internal-kpi/types";

function createRow(overrides: Partial<InternalKpiRowInput> = {}): InternalKpiRowInput {
  return {
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
    officeRevenue: 0,
    ...overrides
  };
}

describe("deriveInternalKpiRow", () => {
  it("calcola Contatti FR automaticamente e usa i contatti per la conversione appuntamenti FR", () => {
    const result = deriveInternalKpiRow(
      createRow({
        frCalls: 100,
        frNotInterested: 30,
        frNoAnswer: 20,
        frAppointments: 10
      })
    );

    expect(result.derived.frContacts).toBe(50);
    expect(result.derived.frAppointmentsConversionRate).toBe(20);
  });

  it("non restituisce contatti FR negativi e segnala l'anomalia", () => {
    const result = deriveInternalKpiRow(
      createRow({
        frCalls: 10,
        frNotInterested: 8,
        frNoAnswer: 5
      })
    );

    expect(result.derived.frContacts).toBe(0);
    expect(result.validation.status).toBe("warning");
    expect(result.validation.errors.map((error) => error.code)).toContain("NEGATIVE_CONTACTS");
  });

  it("mantiene il modello referenze minimale con le formule richieste", () => {
    const result = deriveInternalKpiRow(
      createRow({
        referralCount: 8,
        referralClosed: 2,
        referralRevenue: 1200
      })
    );

    expect(result.derived.referralConversionRate).toBe(25);
    expect(result.derived.referralAverageValue).toBe(150);
    expect(result.derived.referralAverageTicket).toBe(600);
  });

  it("calcola il funnel D2D richiesto senza rinominare D2D", () => {
    const result = deriveInternalKpiRow(
      createRow({
        d2dBase: 20,
        d2dAppointments: 10,
        d2dCompleted: 5,
        d2dNoShow: 2,
        d2dClosed: 2,
        d2dRevenue: 1000
      })
    );

    expect(result.derived.d2dAppointmentsConversionRate).toBe(50);
    expect(result.derived.d2dShowUpRate).toBe(50);
    expect(result.derived.d2dNoShowRate).toBe(20);
    expect(result.derived.d2dClosingRate).toBe(40);
    expect(result.derived.d2dAverageTicket).toBe(500);
  });

  it("calcola le formule ufficio con show-up, no show, closing, recupero e ticket medio", () => {
    const result = deriveInternalKpiRow(
      createRow({
        officeBase: 10,
        officeCompleted: 5,
        officeRescheduled: 2,
        officeNoShow: 4,
        officeClosed: 1,
        officeRevenue: 900
      })
    );

    expect(result.derived.officeShowUpRate).toBe(50);
    expect(result.derived.officeNoShowRate).toBe(40);
    expect(result.derived.officeClosingRate).toBe(20);
    expect(result.derived.officeRecoveryRate).toBe(50);
    expect(result.derived.officeAverageTicket).toBe(900);
  });

  it("gestisce le divisioni per zero restituendo 0 invece di NaN o Infinity", () => {
    const result = deriveInternalKpiRow(createRow());

    expect(result.derived.frContactRate).toBe(0);
    expect(result.derived.referralConversionRate).toBe(0);
    expect(result.derived.d2dShowUpRate).toBe(0);
    expect(result.derived.officeClosingRate).toBe(0);
  });

  it("segnala ricavi presenti con chiusi uguali a zero", () => {
    const result = deriveInternalKpiRow(
      createRow({
        frRevenue: 100,
        referralRevenue: 200,
        d2dRevenue: 300,
        officeRevenue: 400
      })
    );

    expect(result.validation.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "FR_REVENUE_WITHOUT_CLOSED",
        "REFERRAL_REVENUE_WITHOUT_CLOSED",
        "D2D_REVENUE_WITHOUT_CLOSED",
        "OFFICE_REVENUE_WITHOUT_CLOSED"
      ])
    );
  });

  it("segnala quando svolti piu no show superano gli appuntamenti nei funnel", () => {
    const result = deriveInternalKpiRow(
      createRow({
        frAppointments: 5,
        frCompleted: 4,
        frNoShow: 2,
        d2dAppointments: 4,
        d2dCompleted: 3,
        d2dNoShow: 2,
        officeBase: 3,
        officeCompleted: 2,
        officeNoShow: 2
      })
    );

    expect(result.validation.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "FR_OUTCOMES_GT_APPOINTMENTS",
        "D2D_OUTCOMES_GT_APPOINTMENTS",
        "OFFICE_OUTCOMES_GT_BASE"
      ])
    );
  });
});

describe("buildInternalKpiPeriodSummary", () => {
  it("ricalcola le percentuali mensili dai totali e non dalla media semplice delle percentuali giornaliere", () => {
    const summary = buildInternalKpiPeriodSummary([
      createRow({
        reportDate: "2026-07-01",
        dayNumber: 1,
        frAppointments: 10,
        frCompleted: 10,
        frClosed: 1
      }),
      createRow({
        reportDate: "2026-07-02",
        dayNumber: 2,
        frAppointments: 1,
        frCompleted: 1,
        frClosed: 1
      })
    ]);

    expect(summary.total.derived.frClosingRate).toBeCloseTo((2 / 11) * 100, 5);
    expect(summary.total.derived.frClosingRate).not.toBe(55);
  });

  it("calcola la media per giorni attivi usando solo i giorni con attivita e include i weekend attivi", () => {
    const summary = buildInternalKpiPeriodSummary([
      createRow({
        reportDate: "2026-07-03",
        dayNumber: 3,
        dayType: "FERIALE",
        frCalls: 10
      }),
      createRow({
        reportDate: "2026-07-04",
        dayNumber: 4,
        dayType: "SAB",
        d2dBase: 6
      }),
      createRow({
        reportDate: "2026-07-05",
        dayNumber: 5,
        dayType: "DOM"
      })
    ]);

    expect(summary.activeDays).toBe(2);
    expect(summary.averagePerActiveDay.input.frCalls).toBe(5);
    expect(summary.averagePerActiveDay.input.d2dBase).toBe(3);
  });

  it("mantiene tutto a zero se il mese non ha giorni attivi", () => {
    const summary = buildInternalKpiPeriodSummary([
      createRow({
        reportDate: "2026-07-01",
        dayNumber: 1
      }),
      createRow({
        reportDate: "2026-07-02",
        dayNumber: 2,
        dayType: "SAB"
      })
    ]);

    expect(summary.activeDays).toBe(0);
    expect(summary.averagePerActiveDay.input.frCalls).toBe(0);
    expect(summary.averagePerActiveDay.derived.frClosingRate).toBe(0);
  });

  it("somma correttamente importi con due decimali", () => {
    const summary = buildInternalKpiPeriodSummary([
      createRow({
        reportDate: "2026-07-01",
        dayNumber: 1,
        frClosed: 1,
        frRevenue: 10.25
      }),
      createRow({
        reportDate: "2026-07-02",
        dayNumber: 2,
        frClosed: 1,
        frRevenue: 20.75
      })
    ]);

    expect(summary.total.input.frRevenue).toBe(31);
    expect(summary.total.derived.frAverageTicket).toBe(15.5);
  });
});

describe("isInternalKpiActiveDay", () => {
  it("considera attivo un sabato se contiene attivita", () => {
    expect(
      isInternalKpiActiveDay(
        createRow({
          dayType: "SAB",
          officeBase: 1
        })
      )
    ).toBe(true);
  });

  it("non considera attivo un giorno completamente vuoto", () => {
    expect(isInternalKpiActiveDay(createRow())).toBe(false);
  });
});

describe("findDuplicateReportDates", () => {
  it("segnala righe duplicate nello stesso giorno", () => {
    expect(
      findDuplicateReportDates([
        createRow({
          reportDate: "2026-07-01",
          dayNumber: 1
        }),
        createRow({
          reportDate: "2026-07-01",
          dayNumber: 1,
          frCalls: 10
        }),
        createRow({
          reportDate: "2026-07-02",
          dayNumber: 2
        })
      ])
    ).toEqual(["2026-07-01"]);
  });
});
