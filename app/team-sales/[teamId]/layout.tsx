import { AppShell } from "@/components/layout/AppShell";
import { getViewerDisplayName, requireActiveProfile } from "@/lib/auth/session";

export default async function TeamSalesTeamLayout({ children }: { children: React.ReactNode }) {
  const context = await requireActiveProfile();
  const displayName = getViewerDisplayName(context.profile, context.seller);

  return (
    <AppShell
      role={context.profile.role}
      displayName={displayName}
      roleLabel={context.profile.role === "admin" ? "Admin" : "Seller"}
      devMode={context.isDevMode}
    >
      {children}
    </AppShell>
  );
}
