import { AppShell } from "@/components/layout/AppShell";
import { TeamSalesHome } from "@/components/team-sales/TeamSalesHome";
import { getViewerDisplayName, requireActiveProfile } from "@/lib/auth/session";

export default async function TeamSalesHomeRoute() {
  const context = await requireActiveProfile();
  const displayName = getViewerDisplayName(context.profile, context.seller);

  return (
    <AppShell
      role={context.profile.role}
      displayName={displayName}
      roleLabel={context.profile.role === "admin" ? "Admin" : "Seller"}
      devMode={context.isDevMode}
    >
      <TeamSalesHome canCreateTeam={context.profile.role === "admin"} />
    </AppShell>
  );
}
