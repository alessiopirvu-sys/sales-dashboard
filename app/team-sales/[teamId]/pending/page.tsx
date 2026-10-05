import { TeamSalesWorkspace } from "@/components/team-sales/TeamSalesWorkspace";
import { requireActiveProfile } from "@/lib/auth/session";

export default async function TeamSalesPendingRoute({ params }: { params: { teamId: string } }) {
  const context = await requireActiveProfile();

  return (
    <TeamSalesWorkspace
      teamId={params.teamId}
      activeTab="pending"
      canManageSetup
      canManageMonths={context.profile.role === "admin"}
    />
  );
}
