import { TeamSalesWorkspace } from "@/components/team-sales/TeamSalesWorkspace";

export default function TeamSalesPendingRoute({ params }: { params: { teamId: string } }) {
  return <TeamSalesWorkspace teamId={params.teamId} activeTab="pending" canManageSetup />;
}
