import { TeamSalesWorkspace } from "@/components/team-sales/TeamSalesWorkspace";

export default function TeamSalesDashboardRoute({ params }: { params: { teamId: string } }) {
  return <TeamSalesWorkspace teamId={params.teamId} activeTab="dashboard" canManageSetup />;
}
