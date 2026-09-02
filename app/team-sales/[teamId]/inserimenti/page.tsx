import { TeamSalesWorkspace } from "@/components/team-sales/TeamSalesWorkspace";

export default function TeamSalesInserimentiRoute({ params }: { params: { teamId: string } }) {
  return <TeamSalesWorkspace teamId={params.teamId} activeTab="inserimenti" canManageSetup />;
}
