import {
  AggregatedSalesPeriod,
  CalculatedSalesKpis,
  NormalizedSalesRow,
  RankingRow,
  SellerDailyPoint,
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
      accumulator.rifissatoOffice += row.rifissatoOffice;
      accumulator.referenze += row.referenze;
      accumulator.closedReferenze += row.closedReferenze;
      accumulator.revenueReferenze += row.revenueReferenze;
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
      rifissatoOffice: 0,
      referenze: 0,
      closedReferenze: 0,
      revenueReferenze: 0,
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
    },
    referenze: {
      conversionRateReferenze: safeDivide(aggregated.closedReferenze, aggregated.referenze),
      averageValueReferenze: safeDivide(aggregated.revenueReferenze, aggregated.referenze),
      averageClosedValueReferenze: safeDivide(aggregated.revenueReferenze, aggregated.closedReferenze),
      incidenzaReferenze: safeDivide(
        aggregated.revenueReferenze,
        aggregated.revenueFr + aggregated.revenueReferenze
      )
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
      accumulator.referenze += row.referenze;
      accumulator.closedReferenze += row.closedReferenze;
      accumulator.revenueReferenze += row.revenueReferenze;
      accumulator.officeBase += row.officeBase;
      accumulator.appointmentsDoneOffice += row.appointmentsDoneOffice;
      accumulator.noShowOffice += row.noShowOffice;
      accumulator.closedOffice += row.closedOffice;
      accumulator.revenueOffice += row.revenueOffice;
      accumulator.rifissatoOffice += row.rifissatoOffice;
      return accumulator;
    },
    {
      calls: 0,
      appointmentsBooked: 0,
      appointmentsDone: 0,
      dealsClosed: 0,
      revenue: 0,
      referenze: 0,
      closedReferenze: 0,
      revenueReferenze: 0,
      officeBase: 0,
      appointmentsDoneOffice: 0,
      noShowOffice: 0,
      closedOffice: 0,
      revenueOffice: 0,
      rifissatoOffice: 0
    }
  );

  const dealsClosedTotal = totals.dealsClosed + totals.closedReferenze + totals.closedOffice;
  const revenueTotal = totals.revenue + totals.revenueReferenze + totals.revenueOffice;

  return {
    /* ── Funnel freddi (FR only) ── */
    calls: totals.calls,
    appointmentsBooked: totals.appointmentsBooked,
    appointmentsDone: totals.appointmentsDone,
    dealsClosed: totals.dealsClosed,
    revenue: totals.revenue,
    averageTicket: safeDivide(totals.revenue, totals.dealsClosed),
    showUpRate: safeDivide(totals.appointmentsDone, totals.appointmentsBooked) * 100,
    // Closing rate stays aligned with the per-channel rule: chiusiFR / svoltiFR.
    closingRate: safeDivide(totals.dealsClosed, totals.appointmentsDone) * 100,
    conversionRate: safeDivide(totals.dealsClosed, totals.calls) * 100,
    /* ── Referenze ── */
    referenze: totals.referenze,
    closedReferenze: totals.closedReferenze,
    revenueReferenze: totals.revenueReferenze,
    conversionRateReferenze: safeDivide(totals.closedReferenze, totals.referenze) * 100,
    averageValueReferenze: safeDivide(totals.revenueReferenze, totals.referenze),
    averageTicketReferenze: safeDivide(totals.revenueReferenze, totals.closedReferenze),
    /* ── Ufficio ── */
    officeBase: totals.officeBase,
    appointmentsDoneOffice: totals.appointmentsDoneOffice,
    noShowOffice: totals.noShowOffice,
    closedOffice: totals.closedOffice,
    revenueOffice: totals.revenueOffice,
    showUpRateOffice: safeDivide(totals.appointmentsDoneOffice, totals.officeBase) * 100,
    noShowRateOffice: safeDivide(totals.noShowOffice, totals.officeBase) * 100,
    closingRateOffice: safeDivide(totals.closedOffice, totals.appointmentsDoneOffice) * 100,
    averageTicketOffice: safeDivide(totals.revenueOffice, totals.closedOffice),
    rifissatoOffice: totals.rifissatoOffice,
    recoveryRateOffice: safeDivide(totals.rifissatoOffice, totals.noShowOffice) * 100,
    /* ── Totali business (FR + Referenze + Ufficio) ── */
    dealsClosedTotal,
    revenueTotal,
    averageTicketTotal: safeDivide(revenueTotal, dealsClosedTotal)
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
      if (right.revenueTotal !== left.revenueTotal) {
        return right.revenueTotal - left.revenueTotal;
      }
      return right.dealsClosedTotal - left.dealsClosedTotal;
    });
}

export function buildTrendSeries(rows: NormalizedSalesRow[]): TrendPoint[] {
  const grouped = rows.reduce<Map<string, TrendPoint>>((accumulator, row) => {
    const current = accumulator.get(row.date) ?? {
      date: row.date,
      label: row.date.slice(8, 10),
      calls: 0,
      appointmentsBooked: 0,
      appointmentsDone: 0,
      dealsClosed: 0,
      showUpRate: 0,
      closingRate: 0,
      revenue: 0,
      revenueFr: 0,
      revenueReferenze: 0,
      revenueOffice: 0
    };

    current.calls += row.calls;
    current.appointmentsBooked += row.appointmentsBooked;
    current.appointmentsDone += row.appointmentsDone;
    current.dealsClosed += row.dealsClosed;
    current.revenueFr += row.revenueFr;
    current.revenueReferenze += row.revenueReferenze;
    current.revenueOffice += row.revenueOffice;
    current.revenue = current.revenueFr + current.revenueReferenze + current.revenueOffice;
    current.showUpRate = safeDivide(current.appointmentsDone, current.appointmentsBooked) * 100;
    current.closingRate = safeDivide(current.dealsClosed, current.appointmentsDone) * 100;
    accumulator.set(row.date, current);
    return accumulator;
  }, new Map());

  return Array.from(grouped.values()).sort((left, right) => left.date.localeCompare(right.date));
}

export function buildSellerDailySeries(rows: NormalizedSalesRow[]): SellerDailyPoint[] {
  const grouped = rows.reduce<Map<string, SellerDailyPoint>>((accumulator, row) => {
    const key = `${row.seller}::${row.date}`;
    const current = accumulator.get(key) ?? {
      seller: row.seller,
      date: row.date,
      label: row.date.slice(8, 10),
      calls: 0,
      appointmentsBooked: 0,
      appointmentsDone: 0,
      dealsClosed: 0,
      revenueTotal: 0,
      showUpRate: 0,
      closingRate: 0,
      conversionRate: 0
    };

    current.calls += row.calls;
    current.appointmentsBooked += row.appointmentsBooked;
    current.appointmentsDone += row.appointmentsDone;
    current.dealsClosed += row.dealsClosed;
    current.revenueTotal += row.revenue + row.revenueReferenze + row.revenueOffice;
    current.showUpRate = safeDivide(current.appointmentsDone, current.appointmentsBooked) * 100;
    current.closingRate = safeDivide(current.dealsClosed, current.appointmentsDone) * 100;
    current.conversionRate = safeDivide(current.dealsClosed, current.calls) * 100;
    accumulator.set(key, current);
    return accumulator;
  }, new Map());

  return Array.from(grouped.values()).sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }

    return left.seller.localeCompare(right.seller);
  });
}
