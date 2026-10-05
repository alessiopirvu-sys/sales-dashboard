import { TeamSalesWorkspace } from "@/components/team-sales/TeamSalesWorkspace";
import { requireActiveProfile } from "@/lib/auth/session";

export default async function TeamSalesSetupRoute({ params }: { params: { teamId: string } }) {
  const context = await requireActiveProfile();

  return (
    <TeamSalesWorkspace
      teamId={params.teamId}
      activeTab="setup"
      canManageSetup
      canManageMonths={context.profile.role === "admin"}
    />
  );
}
