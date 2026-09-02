import { TeamSalesDashboardData, TeamSalesDayRow, TeamSalesMonthData } from "./types";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function formatPercent(value: number) {
  return `${Math.round((value || 0) * 100)}%`;
}

function buildDayRows(data: TeamSalesMonthData): TeamSalesDayRow[] {
  const { setup, entries } = data;
  const sellerNames = setup.sellers.map((seller) => seller.name);

  const byDate = new Map<string, Record<string, number>>();
  entries.forEach((entry) => {
    const bucket = byDate.get(entry.saleDate) ?? Object.fromEntries(sellerNames.map((name) => [name, 0]));
    bucket[entry.sellerName] = (bucket[entry.sellerName] ?? 0) + Number(entry.amount || 0);
    byDate.set(entry.saleDate, bucket);
  });

  const sortedDates = Array.from(byDate.keys()).sort();
  let cumulative = 0;

  return Array.from({ length: setup.workingDays }, (_, index) => {
    const date = sortedDates[index] ?? "";
    const salesBySeller = date
      ? (byDate.get(date) as Record<string, number>)
      : Object.fromEntries(sellerNames.map((name) => [name, 0]));
    const dayTotal = Object.values(salesBySeller).reduce((sum, amount) => sum + amount, 0);
    cumulative += dayTotal;

    return {
      day: index + 1,
      date,
      salesBySeller,
      dayTotal,
      cumulative,
      isCompleted: Boolean(date)
    };
  });
}

export function deriveDashboardData(data: TeamSalesMonthData): TeamSalesDashboardData {
  const days = buildDayRows(data);
  const soldTotal = days.reduce((sum, day) => sum + day.dayTotal, 0);
  const targetTotal = Number(data.setup.targetTotal || 0);
  const missingToTarget = Math.max(0, targetTotal - soldTotal);
  const progress = targetTotal > 0 ? soldTotal / targetTotal : 0;

  const pendingValue = data.pending.reduce((sum, row) => sum + Number(row.value || 0), 0);
  const pendingCount = data.pending.length;
  const pendingCoverage = missingToTarget > 0 ? Math.min(1, pendingValue / missingToTarget) : pendingValue > 0 ? 1 : 0;

  const daysElapsed = days.filter((day) => day.isCompleted).length;
  const daysRemaining = Math.max(0, data.setup.workingDays - daysElapsed);
  const targetDaily = data.setup.workingDays > 0 ? targetTotal / data.setup.workingDays : 0;
  const targetWeekly = targetDaily * 5;
  const currentDaily = daysElapsed > 0 ? soldTotal / daysElapsed : 0;
  const requiredDaily = daysRemaining > 0 ? missingToTarget / daysRemaining : 0;
  const monthProjection = currentDaily * data.setup.workingDays;

  const salesTotalsByName = new Map<string, number>();
  data.setup.sellers.forEach((seller) => salesTotalsByName.set(seller.name, 0));
  days.forEach((day) => {
    Object.entries(day.salesBySeller).forEach(([name, amount]) => {
      salesTotalsByName.set(name, (salesTotalsByName.get(name) ?? 0) + amount);
    });
  });

  const salesBySeller = Array.from(salesTotalsByName.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  return {
    setup: data.setup,
    days,
    pending: data.pending,
    salesBySeller,
    summary: {
      soldTotal,
      targetTotal,
      missingToTarget,
      progress,
      pendingValue,
      pendingCount,
      pendingCoverage,
      targetDaily,
      targetWeekly,
      currentDaily,
      requiredDaily,
      daysElapsed,
      daysRemaining,
      monthProjection
    }
  };
}
