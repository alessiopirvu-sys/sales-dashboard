import {
  AggregatedSalesPeriod,
  CalculatedSalesKpis,
  NormalizedSalesRow,
  RankingRow,
  SummaryMetrics,
  TrendPoint
} from "@/lib/types";

function safeDivide(numerator: number, denominator: number) {
  return denominator ? numerator / denominator : 0;
}

export function aggregateSalesRowsByPeriod(
  rows: NormalizedSalesRow[],
  options?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }
): AggregatedSalesPeriod {
  const filteredRows = rows.filter((row) => {
    const matchesStart = !options?.startDate || row.date >= options.startDate;
    const matchesEnd = !options?.endDate || row.date <= options.endDate;
    const matchesType = !options?.type || row.type === options.type;
    return matchesStart && matchesEnd && matchesType;
  });

  return filteredRows.reduce<AggregatedSalesPeriod>(
    (accumulator, row) => {
      accumulator.callsFr += row.callsFr;
      accumulator.notInterestedFr += row.notInterestedFr;
      accumulator.nrFr += row.nrFr;
      accumulator.appointmentsBookedFr += row.appointmentsBookedFr;
      accumulator.appointmentsDoneFr += row.appointmentsDoneFr;
      accumulator.noShowFr += row.noShowFr;
      accumulator.closedFr += row.closedFr;
      accumulator.revenueFr += row.revenueFr;
      accumulator.contactsFr += row.contactsFr;
      accumulator.d2dBase += row.d2dBase;
      accumulator.appointmentsBookedD2d += row.appointmentsBookedD2d;
      accumulator.appointmentsDoneD2d += row.appointmentsDoneD2d;
      accumulator.noShowD2d += row.noShowD2d;
      accumulator.closedD2d += row.closedD2d;
      accumulator.revenueD2d += row.revenueD2d;
      accumulator.officeBase += row.officeBase;
      accumulator.appointmentsDoneOffice += row.appointmentsDoneOffice;
      accumulator.noShowOffice += row.noShowOffice;
      accumulator.closedOffice += row.closedOffice;
      accumulator.revenueOffice += row.revenueOffice;
      accumulator.calls += row.calls;
      accumulator.appointmentsBooked += row.appointmentsBooked;
      accumulator.appointmentsDone += row.appointmentsDone;
      accumulator.dealsClosed += row.dealsClosed;
      accumulator.revenue += row.revenue;
      accumulator.rowsCount += 1;
      return accumulator;
    },
    {
      callsFr: 0,
      notInterestedFr: 0,
      nrFr: 0,
      appointmentsBookedFr: 0,
      appointmentsDoneFr: 0,
      noShowFr: 0,
      closedFr: 0,
      revenueFr: 0,
      contactsFr: 0,
      d2dBase: 0,
      appointmentsBookedD2d: 0,
      appointmentsDoneD2d: 0,
      noShowD2d: 0,
      closedD2d: 0,
      revenueD2d: 0,
      officeBase: 0,
      appointmentsDoneOffice: 0,
      noShowOffice: 0,
      closedOffice: 0,
      revenueOffice: 0,
      calls: 0,
      appointmentsBooked: 0,
      appointmentsDone: 0,
      dealsClosed: 0,
      revenue: 0,
      rowsCount: 0
    }
  );
}

export function calculateSalesKpis(aggregated: AggregatedSalesPeriod): CalculatedSalesKpis {
  return {
    fr: {
      contactRate: safeDivide(aggregated.contactsFr, aggregated.callsFr),
      nrRate: safeDivide(aggregated.nrFr, aggregated.callsFr),
      appointmentsConversionRate: safeDivide(
        aggregated.appointmentsBookedFr,
        aggregated.callsFr
      ),
      showUpRate: safeDivide(
        aggregated.appointmentsDoneFr,
        aggregated.appointmentsBookedFr
      ),
      noShowRate: safeDivide(aggregated.noShowFr, aggregated.appointmentsBookedFr),
      // Closing is always calculated on completed appointments, never on booked ones.
      closingRate: safeDivide(aggregated.closedFr, aggregated.appointmentsDoneFr),
      averageTicket: safeDivide(aggregated.revenueFr, aggregated.closedFr)
    },
    d2d: {
      showUpRateD2d: safeDivide(
        aggregated.appointmentsDoneD2d,
        aggregated.appointmentsBookedD2d
      ),
      closingRateD2d: safeDivide(aggregated.closedD2d, aggregated.appointmentsDoneD2d)
    },
    office: {
      showUpRateOffice: safeDivide(aggregated.appointmentsDoneOffice, aggregated.officeBase),
      closingRateOffice: safeDivide(aggregated.closedOffice, aggregated.appointmentsDoneOffice)
    }
  };
}

export function calculateSummaryMetrics(rows: NormalizedSalesRow[]): SummaryMetrics {
  const totals = rows.reduce(
    (accumulator, row) => {
      accumulator.calls += row.calls;
      accumulator.appointmentsBooked += row.appointmentsBooked;
      accumulator.appointmentsDone += row.appointmentsDone;
      accumulator.dealsClosed += row.dealsClosed;
      accumulator.revenue += row.revenue;
      return accumulator;
    },
    {
      calls: 0,
      appointmentsBooked: 0,
      appointmentsDone: 0,
      dealsClosed: 0,
      revenue: 0
    }
  );

  return {
    ...totals,
    averageTicket: safeDivide(totals.revenue, totals.dealsClosed),
    showUpRate: safeDivide(totals.appointmentsDone, totals.appointmentsBooked) * 100,
    // Aggregate closing rate stays aligned with the per-channel rule: closed / done.
    closingRate: safeDivide(totals.dealsClosed, totals.appointmentsDone) * 100,
    conversionRate: safeDivide(totals.dealsClosed, totals.calls) * 100
  };
}

export function buildSellerRanking(rows: NormalizedSalesRow[]): RankingRow[] {
  const grouped = rows.reduce<Map<string, NormalizedSalesRow[]>>((accumulator, row) => {
    const currentRows = accumulator.get(row.seller) ?? [];
    currentRows.push(row);
    accumulator.set(row.seller, currentRows);
    return accumulator;
  }, new Map());

  return Array.from(grouped.entries())
    .map(([seller, sellerRows]) => ({
      seller,
      ...calculateSummaryMetrics(sellerRows)
    }))
    .sort((left, right) => {
      if (right.revenue !== left.revenue) {
        return right.revenue - left.revenue;
      }
      return right.dealsClosed - left.dealsClosed;
    });
}

export function buildTrendSeries(rows: NormalizedSalesRow[]): TrendPoint[] {
  const grouped = rows.reduce<Map<string, TrendPoint>>((accumulator, row) => {
    const current = accumulator.get(row.date) ?? {
      date: row.date,
      label: row.date.slice(8, 10),
      calls: 0,
      revenue: 0
    };

    current.calls += row.calls;
    current.revenue += row.revenue;
    accumulator.set(row.date, current);
    return accumulator;
  }, new Map());

  return Array.from(grouped.values()).sort((left, right) => left.date.localeCompare(right.date));
}
