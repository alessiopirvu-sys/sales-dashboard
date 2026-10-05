import { TeamSalesWorkspace } from "@/components/team-sales/TeamSalesWorkspace";
import { requireActiveProfile } from "@/lib/auth/session";

export default async function TeamSalesInserimentiRoute({ params }: { params: { teamId: string } }) {
  const context = await requireActiveProfile();

  return (
    <TeamSalesWorkspace
      teamId={params.teamId}
      activeTab="inserimenti"
      canManageSetup
      canManageMonths={context.profile.role === "admin"}
    />
  );
}
