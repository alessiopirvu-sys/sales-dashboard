import { deriveInternalKpiRow } from "@/lib/internal-kpi/formulas";
import {
  DayType,
  InternalKpiDailyRow,
  InternalKpiRowInput,
  ReportingPeriodStatus
} from "@/lib/internal-kpi/types";

function getDayType(date: Date): DayType {
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

const JULY_2026_MOCK: Record<number, Partial<InternalKpiRowInput>> = {
  1: {
    frCalls: 38,
    frNotInterested: 9,
    frNoAnswer: 12,
    frAppointments: 5,
    frCompleted: 3,
    frNoShow: 1,
    frClosed: 1,
    frRevenue: 1480,
    referralCount: 1,
    officeBase: 3,
    officeCompleted: 2,
    officeNoShow: 1,
    officeClosed: 1,
    officeRevenue: 890
  },
  2: {
    frCalls: 41,
    frNotInterested: 11,
    frNoAnswer: 8,
    frAppointments: 6,
    frCompleted: 4,
    frNoShow: 1,
    frClosed: 1,
    frRevenue: 1760,
    d2dBase: 5,
    d2dAppointments: 2,
    d2dCompleted: 1,
    officeBase: 2,
    officeCompleted: 2
  },
  3: {
    frCalls: 35,
    frNotInterested: 8,
    frNoAnswer: 7,
    frAppointments: 5,
    frCompleted: 4,
    frClosed: 2,
    frRevenue: 2840,
    referralCount: 2,
    referralClosed: 1,
    referralRevenue: 750,
    officeBase: 1,
    officeCompleted: 1
  },
  6: {
    frCalls: 33,
    frNotInterested: 10,
    frNoAnswer: 9,
    frAppointments: 4,
    frCompleted: 2,
    frNoShow: 1,
    frClosed: 1,
    frRevenue: 1320,
    officeBase: 4,
    officeCompleted: 3,
    officeRescheduled: 1,
    officeNoShow: 1,
    d2dBase: 6,
    d2dAppointments: 3,
    d2dCompleted: 2
  },
  7: {
    frCalls: 44,
    frNotInterested: 12,
    frNoAnswer: 10,
    frAppointments: 7,
    frCompleted: 5,
    frNoShow: 1,
    frClosed: 2,
    frRevenue: 3290,
    referralCount: 1,
    d2dBase: 4,
    d2dAppointments: 2,
    d2dCompleted: 1,
    officeBase: 2,
    officeCompleted: 1,
    officeRescheduled: 1
  },
  8: {
    frCalls: 29,
    frNotInterested: 7,
    frNoAnswer: 6,
    frAppointments: 4,
    frCompleted: 3,
    frClosed: 1,
    frRevenue: 1190,
    officeBase: 3,
    officeCompleted: 2,
    officeClosed: 1,
    officeRevenue: 940
  },
  9: {
    frCalls: 46,
    frNotInterested: 13,
    frNoAnswer: 12,
    frAppointments: 6,
    frCompleted: 3,
    frNoShow: 2,
    frClosed: 1,
    frRevenue: 1430,
    referralCount: 3,
    d2dBase: 6,
    d2dAppointments: 3,
    d2dCompleted: 2,
    d2dClosed: 1,
    d2dRevenue: 680
  },
  10: {
    frCalls: 31,
    frNotInterested: 8,
    frNoAnswer: 6,
    frAppointments: 4,
    frCompleted: 4,
    frClosed: 2,
    frRevenue: 2540,
    officeBase: 2,
    officeCompleted: 2,
    officeClosed: 1,
    officeRevenue: 720
  },
  13: {
    frCalls: 39,
    frNotInterested: 9,
    frNoAnswer: 11,
    frAppointments: 5,
    frCompleted: 3,
    frNoShow: 1,
    frClosed: 1,
    frRevenue: 1670,
    referralCount: 2,
    referralClosed: 1,
    referralRevenue: 620,
    officeBase: 4,
    officeCompleted: 3,
    officeRescheduled: 1,
    officeNoShow: 1
  },
  14: {
    frCalls: 36,
    frNotInterested: 10,
    frNoAnswer: 8,
    frAppointments: 5,
    frCompleted: 4,
    frClosed: 2,
    frRevenue: 3010,
    d2dBase: 7,
    d2dAppointments: 3,
    d2dCompleted: 2,
    d2dNoShow: 1,
    officeBase: 1,
    officeCompleted: 1
  }
};

function getOverrides(year: number, month: number) {
  if (year === 2026 && month === 7) {
    return JULY_2026_MOCK;
  }

  return {};
}

export function getMockPeriodStatus(year: number, month: number): ReportingPeriodStatus {
  if (year > 2026) {
    return "open";
  }

  if (year === 2026 && month >= 7) {
    return "open";
  }

  return "locked";
}

export function buildMockSpreadsheetRows(year: number, month: number): InternalKpiDailyRow[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const overrides = getOverrides(year, month);

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month - 1, index + 1);
    const input = {
      ...createBaseInput(date),
      ...(overrides[index + 1] ?? {})
    };
    const derivedRow = deriveInternalKpiRow(input);

    return {
      source: "manual",
      input,
      derived: derivedRow.derived,
      validation: derivedRow.validation
    };
  });
}
