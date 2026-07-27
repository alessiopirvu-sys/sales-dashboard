import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { getViewerDisplayName, requireAdmin } from "@/lib/auth/session";

export default async function DashboardRoute() {
  const context = await requireAdmin();

  return (
    <AppShell
      role="admin"
      displayName={getViewerDisplayName(context.profile)}
      roleLabel="Admin"
      devMode={context.isDevMode}
    >
      <DashboardPage />
    </AppShell>
  );
}
