import { TeamSalesWorkspace } from "@/components/team-sales/TeamSalesWorkspace";

export default function TeamSalesSetupRoute({ params }: { params: { teamId: string } }) {
  return <TeamSalesWorkspace teamId={params.teamId} activeTab="setup" canManageSetup />;
}
