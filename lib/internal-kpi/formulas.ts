import {
  DayType,
  InternalKpiDailyRow,
  InternalKpiDerivedFieldKey,
  InternalKpiInputFieldKey,
  InternalKpiPeriodSummary,
  InternalKpiRowDerived,
  InternalKpiRowInput,
  InternalKpiValidationError,
  ValidationStatus
} from "@/lib/internal-kpi/types";

export const INTERNAL_KPI_INTEGER_FIELDS: InternalKpiInputFieldKey[] = [
  "frCalls",
  "frNotInterested",
  "frNoAnswer",
  "frAppointments",
  "frCompleted",
  "frNoShow",
  "frClosed",
  "referralCount",
  "referralClosed",
  "d2dBase",
  "d2dAppointments",
  "d2dCompleted",
  "d2dNoShow",
  "d2dClosed",
  "officeBase",
  "officeCompleted",
  "officeRescheduled",
  "officeNoShow",
  "officeClosed"
];

export const INTERNAL_KPI_CURRENCY_FIELDS: InternalKpiInputFieldKey[] = [
  "frRevenue",
  "referralRevenue",
  "d2dRevenue",
  "officeRevenue"
];

export const INTERNAL_KPI_INPUT_FIELDS: InternalKpiInputFieldKey[] = [
  ...INTERNAL_KPI_INTEGER_FIELDS,
  ...INTERNAL_KPI_CURRENCY_FIELDS
];

function safeDivide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function toPercentage(numerator: number, denominator: number) {
  return safeDivide(numerator, denominator) * 100;
}

function createEmptyInput(dayType: DayType = "FERIALE"): InternalKpiRowInput {
  return {
    reportDate: "",
    dayNumber: 1,
    dayType,
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

function createValidationError(
  code: InternalKpiValidationError["code"],
  message: string,
  fieldKeys: Array<InternalKpiInputFieldKey | InternalKpiDerivedFieldKey>
): InternalKpiValidationError {
  return {
    code,
    message,
    severity: "warning",
    fieldKeys
  };
}

function hasPositiveRevenueWithoutClosed(revenue: number, closed: number) {
  return revenue > 0 && closed === 0;
}

export function getValidationStatus(errors: InternalKpiValidationError[]): ValidationStatus {
  if (errors.length === 0) {
    return "valid";
  }

  return errors.some((error) => error.severity === "error") ? "error" : "warning";
}

export function deriveInternalKpiRow(
  input: InternalKpiRowInput
): Pick<InternalKpiDailyRow, "input" | "derived" | "validation"> {
  const errors: InternalKpiValidationError[] = [];
  const rawFrContacts = input.frCalls - input.frNotInterested - input.frNoAnswer;
  const frContacts = Math.max(0, rawFrContacts);

  if (rawFrContacts < 0) {
    errors.push(
      createValidationError(
        "NEGATIVE_CONTACTS",
        "I contatti FR risultano negativi. Controlla chiamate, non interessati e NR.",
        ["frCalls", "frNotInterested", "frNoAnswer", "frContacts"]
      )
    );
  }

  if (input.frCompleted > input.frAppointments) {
    errors.push(
      createValidationError(
        "FR_COMPLETED_GT_APPOINTMENTS",
        "Gli svolti FR non possono superare gli appuntamenti presi FR.",
        ["frAppointments", "frCompleted"]
      )
    );
  }

  if (input.frNoShow > input.frAppointments) {
    errors.push(
      createValidationError(
        "FR_NO_SHOW_GT_APPOINTMENTS",
        "I no show FR non possono superare gli appuntamenti presi FR.",
        ["frAppointments", "frNoShow"]
      )
    );
  }

  if (input.frCompleted + input.frNoShow > input.frAppointments) {
    errors.push(
      createValidationError(
        "FR_OUTCOMES_GT_APPOINTMENTS",
        "La somma di svolti FR e no show FR non puo superare gli appuntamenti presi FR.",
        ["frAppointments", "frCompleted", "frNoShow"]
      )
    );
  }

  if (input.frClosed > input.frCompleted) {
    errors.push(
      createValidationError(
        "FR_CLOSED_GT_COMPLETED",
        "I chiusi FR non possono superare gli svolti FR.",
        ["frCompleted", "frClosed"]
      )
    );
  }

  if (hasPositiveRevenueWithoutClosed(input.frRevenue, input.frClosed)) {
    errors.push(
      createValidationError(
        "FR_REVENUE_WITHOUT_CLOSED",
        "Sono presenti ricavi FR con chiusi FR pari a zero.",
        ["frRevenue", "frClosed"]
      )
    );
  }

  if (input.referralClosed > input.referralCount) {
    errors.push(
      createValidationError(
        "REFERRAL_CLOSED_GT_TOTAL",
        "I chiusi referenze non possono superare il numero di referenze.",
        ["referralCount", "referralClosed"]
      )
    );
  }

  if (hasPositiveRevenueWithoutClosed(input.referralRevenue, input.referralClosed)) {
    errors.push(
      createValidationError(
        "REFERRAL_REVENUE_WITHOUT_CLOSED",
        "Sono presenti ricavi referenze con chiusi referenze pari a zero.",
        ["referralRevenue", "referralClosed"]
      )
    );
  }

  if (input.d2dAppointments > input.d2dBase) {
    errors.push(
      createValidationError(
        "D2D_APPOINTMENTS_GT_BASE",
        "Gli App D2D non possono superare il valore D2D.",
        ["d2dBase", "d2dAppointments"]
      )
    );
  }

  if (input.d2dCompleted > input.d2dAppointments) {
    errors.push(
      createValidationError(
        "D2D_COMPLETED_GT_APPOINTMENTS",
        "Gli svolti D2D non possono superare gli App D2D.",
        ["d2dAppointments", "d2dCompleted"]
      )
    );
  }

  if (input.d2dNoShow > input.d2dAppointments) {
    errors.push(
      createValidationError(
        "D2D_NO_SHOW_GT_APPOINTMENTS",
        "I no show D2D non possono superare gli App D2D.",
        ["d2dAppointments", "d2dNoShow"]
      )
    );
  }

  if (input.d2dCompleted + input.d2dNoShow > input.d2dAppointments) {
    errors.push(
      createValidationError(
        "D2D_OUTCOMES_GT_APPOINTMENTS",
        "La somma di svolti D2D e no show D2D non puo superare gli App D2D.",
        ["d2dAppointments", "d2dCompleted", "d2dNoShow"]
      )
    );
  }

  if (input.d2dClosed > input.d2dCompleted) {
    errors.push(
      createValidationError(
        "D2D_CLOSED_GT_COMPLETED",
        "I chiusi D2D non possono superare gli svolti D2D.",
        ["d2dCompleted", "d2dClosed"]
      )
    );
  }

  if (hasPositiveRevenueWithoutClosed(input.d2dRevenue, input.d2dClosed)) {
    errors.push(
      createValidationError(
        "D2D_REVENUE_WITHOUT_CLOSED",
        "Sono presenti ricavi D2D con chiusi D2D pari a zero.",
        ["d2dRevenue", "d2dClosed"]
      )
    );
  }

  if (input.officeCompleted > input.officeBase) {
    errors.push(
      createValidationError(
        "OFFICE_COMPLETED_GT_BASE",
        "Gli svolti ufficio non possono superare Ufficio.",
        ["officeBase", "officeCompleted"]
      )
    );
  }

  if (input.officeNoShow > input.officeBase) {
    errors.push(
      createValidationError(
        "OFFICE_NO_SHOW_GT_BASE",
        "I no show ufficio non possono superare Ufficio.",
        ["officeBase", "officeNoShow"]
      )
    );
  }

  if (input.officeCompleted + input.officeNoShow > input.officeBase) {
    errors.push(
      createValidationError(
        "OFFICE_OUTCOMES_GT_BASE",
        "La somma di ufficio svolti e no show ufficio non puo superare Ufficio.",
        ["officeBase", "officeCompleted", "officeNoShow"]
      )
    );
  }

  if (input.officeClosed > input.officeCompleted) {
    errors.push(
      createValidationError(
        "OFFICE_CLOSED_GT_COMPLETED",
        "Gli ufficio chiusi non possono superare gli ufficio svolti.",
        ["officeCompleted", "officeClosed"]
      )
    );
  }

  if (input.officeRescheduled > input.officeNoShow) {
    errors.push(
      createValidationError(
        "OFFICE_RESCHEDULED_GT_NO_SHOW",
        "I rifissati non possono superare i no show ufficio.",
        ["officeRescheduled", "officeNoShow"]
      )
    );
  }

  if (hasPositiveRevenueWithoutClosed(input.officeRevenue, input.officeClosed)) {
    errors.push(
      createValidationError(
        "OFFICE_REVENUE_WITHOUT_CLOSED",
        "Sono presenti ricavi ufficio con ufficio chiusi pari a zero.",
        ["officeRevenue", "officeClosed"]
      )
    );
  }

  const derived: InternalKpiRowDerived = {
    frContacts,
    frContactRate: toPercentage(frContacts, input.frCalls),
    frNotInterestedRate: toPercentage(input.frNotInterested, input.frCalls),
    frNoAnswerRate: toPercentage(input.frNoAnswer, input.frCalls),
    frAppointmentsConversionRate: toPercentage(input.frAppointments, frContacts),
    frShowUpRate: toPercentage(input.frCompleted, input.frAppointments),
    frNoShowRate: toPercentage(input.frNoShow, input.frAppointments),
    frClosingRate: toPercentage(input.frClosed, input.frCompleted),
    frAverageTicket: safeDivide(input.frRevenue, input.frClosed),
    referralConversionRate: toPercentage(input.referralClosed, input.referralCount),
    referralAverageValue: safeDivide(input.referralRevenue, input.referralCount),
    referralAverageTicket: safeDivide(input.referralRevenue, input.referralClosed),
    d2dAppointmentsConversionRate: toPercentage(input.d2dAppointments, input.d2dBase),
    d2dShowUpRate: toPercentage(input.d2dCompleted, input.d2dAppointments),
    d2dNoShowRate: toPercentage(input.d2dNoShow, input.d2dAppointments),
    d2dClosingRate: toPercentage(input.d2dClosed, input.d2dCompleted),
    d2dAverageTicket: safeDivide(input.d2dRevenue, input.d2dClosed),
    officeShowUpRate: toPercentage(input.officeCompleted, input.officeBase),
    officeNoShowRate: toPercentage(input.officeNoShow, input.officeBase),
    officeClosingRate: toPercentage(input.officeClosed, input.officeCompleted),
    officeRecoveryRate: toPercentage(input.officeRescheduled, input.officeNoShow),
    officeAverageTicket: safeDivide(input.officeRevenue, input.officeClosed)
  };

  return {
    input,
    derived,
    validation: {
      status: getValidationStatus(errors),
      errors
    }
  };
}

export function isInternalKpiActiveDay(input: InternalKpiRowInput) {
  return INTERNAL_KPI_INPUT_FIELDS.some((fieldKey) => input[fieldKey] > 0);
}

export function findDuplicateReportDates(rows: InternalKpiRowInput[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.reportDate, (counts.get(row.reportDate) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([reportDate]) => reportDate);
}

export function sumInternalKpiInputs(rows: InternalKpiRowInput[]): InternalKpiRowInput {
  if (rows.length === 0) {
    return createEmptyInput();
  }

  const [firstRow] = rows;
  const base = createEmptyInput(firstRow.dayType);
  base.reportDate = firstRow.reportDate;
  base.dayNumber = firstRow.dayNumber;

  return rows.reduce<InternalKpiRowInput>((accumulator, row) => {
    for (const fieldKey of INTERNAL_KPI_INPUT_FIELDS) {
      accumulator[fieldKey] += row[fieldKey];
    }

    return accumulator;
  }, base);
}

export function divideInternalKpiInputByDays(
  input: InternalKpiRowInput,
  activeDays: number
): InternalKpiRowInput {
  const divisor = activeDays > 0 ? activeDays : 1;
  const base = createEmptyInput(input.dayType);
  base.reportDate = input.reportDate;
  base.dayNumber = input.dayNumber;

  for (const fieldKey of INTERNAL_KPI_INTEGER_FIELDS) {
    base[fieldKey] = input[fieldKey] / divisor;
  }

  for (const fieldKey of INTERNAL_KPI_CURRENCY_FIELDS) {
    base[fieldKey] = input[fieldKey] / divisor;
  }

  return base;
}

export function buildInternalKpiPeriodSummary(
  rows: InternalKpiRowInput[]
): InternalKpiPeriodSummary {
  const totalInput = sumInternalKpiInputs(rows);
  const activeRows = rows.filter((row) => isInternalKpiActiveDay(row));
  const activeDays = activeRows.length;
  const averageInput = divideInternalKpiInputByDays(totalInput, activeDays || 1);

  return {
    activeDays,
    total: deriveInternalKpiRow(totalInput),
    averagePerActiveDay: deriveInternalKpiRow(averageInput)
  };
}
