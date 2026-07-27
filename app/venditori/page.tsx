import { AppShell } from "@/components/layout/AppShell";
import { SellersPage } from "@/components/sellers/SellersPage";
import { getViewerDisplayName, requireAdmin } from "@/lib/auth/session";

export default async function SellersRoute() {
  const context = await requireAdmin();

  return (
    <AppShell
      role="admin"
      displayName={getViewerDisplayName(context.profile)}
      roleLabel="Admin"
      devMode={context.isDevMode}
    >
      <SellersPage />
    </AppShell>
  );
}
