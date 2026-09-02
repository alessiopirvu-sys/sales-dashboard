export type TeamSalesSeller = {
  id?: string;
  sellerId: string | null;
  name: string;
  target: number;
};

export type RegisteredSeller = {
  id: string;
  name: string;
  is_active: boolean;
};

export type TeamSalesEntry = {
  id?: string;
  sellerName: string;
  saleDate: string; // YYYY-MM-DD
  amount: number;
};

export type TeamSalesPendingRow = {
  id?: string;
  client: string;
  sellerName: string;
  value: number;
  phase: string;
  closeDate: string | null; // YYYY-MM-DD
  notes: string;
};

export type TeamSalesSetup = {
  teamName: string;
  monthLabel: string;
  year: number;
  month: number;
  targetTotal: number;
  workingDays: number;
  sellers: TeamSalesSeller[];
};

export type TeamSalesTeamSummary = {
  id: string;
  name: string;
};

export type TeamSalesOverviewRow = {
  teamId: string;
  teamName: string;
  monthLabel: string | null;
  targetTotal: number;
  workingDays: number;
  soldTotal: number;
  pendingValue: number;
  pendingCount: number;
  topSellerName: string | null;
  topSellerTotal: number;
};

export type TeamSalesMonthData = {
  teamId: string;
  teamMonthId: string | null;
  setup: TeamSalesSetup;
  entries: TeamSalesEntry[];
  pending: TeamSalesPendingRow[];
};

export type TeamSalesDayRow = {
  day: number;
  date: string; // YYYY-MM-DD or ""
  salesBySeller: Record<string, number>;
  dayTotal: number;
  cumulative: number;
  isCompleted: boolean;
};

export type TeamSalesDashboardData = {
  setup: TeamSalesSetup;
  days: TeamSalesDayRow[];
  pending: TeamSalesPendingRow[];
  salesBySeller: { name: string; total: number }[];
  summary: {
    soldTotal: number;
    targetTotal: number;
    missingToTarget: number;
    progress: number;
    pendingValue: number;
    pendingCount: number;
    pendingCoverage: number;
    targetDaily: number;
    targetWeekly: number;
    currentDaily: number;
    requiredDaily: number;
    daysElapsed: number;
    daysRemaining: number;
    monthProjection: number;
  };
};
