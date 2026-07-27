import { describe, expect, it } from "vitest";

import { deriveInternalKpiRow } from "../../lib/internal-kpi/formulas";
import {
  getSpreadsheetColumnByKey,
  KPI_SPREADSHEET_COLUMNS
} from "../../lib/internal-kpi/spreadsheet-config";
import {
  buildSpreadsheetTotals,
  getCellValidationMessage,
  isCalculatedSpreadsheetCell,
  parseSpreadsheetInputValue,
  updateSpreadsheetRowValue
} from "../../lib/internal-kpi/spreadsheet-utils";
import { InternalKpiDailyRow, InternalKpiRowInput } from "../../lib/internal-kpi/types";

function createRowInput(overrides: Partial<InternalKpiRowInput> = {}): InternalKpiRowInput {
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

function createDailyRow(overrides: Partial<InternalKpiRowInput> = {}): InternalKpiDailyRow {
  const input = createRowInput(overrides);
  const derived = deriveInternalKpiRow(input);

  return {
    source: "manual",
    input,
    derived: derived.derived,
    validation: derived.validation
  };
}

describe("spreadsheet FR helpers", () => {
  it("calcola contatti e conversione FR attraverso le utility della griglia", () => {
    const row = createDailyRow({
      frCalls: 42,
      frNotInterested: 10,
      frNoAnswer: 8,
      frAppointments: 6,
      frCompleted: 4,
      frClosed: 2,
      frRevenue: 1800
    });

    expect(row.derived.frContacts).toBe(24);
    expect(row.derived.frAppointmentsConversionRate).toBe(25);
    expect(row.derived.frShowUpRate).toBeCloseTo(66.666, 2);
    expect(row.derived.frClosingRate).toBe(50);
    expect(row.derived.frAverageTicket).toBe(900);
  });

  it("aggiorna i totali in modo coerente con i valori modificati", () => {
    const rows = [
      createDailyRow({ frCalls: 30, frAppointments: 5, frCompleted: 4, frClosed: 1, frRevenue: 1000 }),
      createDailyRow({ reportDate: "2026-07-02", dayNumber: 2, frCalls: 20, frAppointments: 3, frCompleted: 2, frClosed: 1, frRevenue: 500 })
    ];

    const totals = buildSpreadsheetTotals(rows);

    expect(totals.total.input.frCalls).toBe(50);
    expect(totals.total.input.frClosed).toBe(2);
    expect(totals.total.input.frRevenue).toBe(1500);
    expect(totals.total.derived.frClosingRate).toBeCloseTo((2 / 6) * 100, 4);
  });

  it("impedisce la modifica delle celle calcolate", () => {
    expect(isCalculatedSpreadsheetCell("frContacts")).toBe(true);
    expect(isCalculatedSpreadsheetCell("frCalls")).toBe(false);
  });

  it("rende disponibile il messaggio di validazione per la cella errata", () => {
    const row = createDailyRow({
      frCalls: 5,
      frNotInterested: 4,
      frNoAnswer: 4
    });

    expect(getCellValidationMessage(row, "frContacts")).toContain("contatti FR risultano negativi");
  });

  it("normalizza numeri interi e decimali per le celle editabili", () => {
    const integerColumn = getSpreadsheetColumnByKey("frCalls");
    const currencyColumn = getSpreadsheetColumnByKey("frRevenue");

    expect(integerColumn).toBeDefined();
    expect(currencyColumn).toBeDefined();
    expect(parseSpreadsheetInputValue("12,9", integerColumn!)).toBe(13);
    expect(parseSpreadsheetInputValue("12,345", currencyColumn!)).toBe(12.35);
    expect(parseSpreadsheetInputValue("-3", integerColumn!)).toBe(0);
  });

  it("ricalcola immediatamente la riga dopo una modifica mock", () => {
    const row = createDailyRow({ frCalls: 20, frAppointments: 3, frCompleted: 2, frClosed: 1, frRevenue: 800 });
    const updated = updateSpreadsheetRowValue(row, "frCalls", 35);

    expect(updated.input.frCalls).toBe(35);
    expect(updated.derived.frContacts).toBe(35);
  });

  it("mantiene la colonna calendario come prima colonna sticky del foglio", () => {
    expect(KPI_SPREADSHEET_COLUMNS[0].key).toBe("calendar");
    expect(KPI_SPREADSHEET_COLUMNS[0].editable).toBe(false);
  });
});
