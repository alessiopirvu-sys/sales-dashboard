import { ExportsPage } from "@/components/export/ExportsPage";
import { AppShell } from "@/components/layout/AppShell";
import { getViewerDisplayName, requireAdmin } from "@/lib/auth/session";

export default async function ExportsRoute() {
  const context = await requireAdmin();

  return (
    <AppShell
      role="admin"
      displayName={getViewerDisplayName(context.profile)}
      roleLabel="Admin"
      devMode={context.isDevMode}
    >
      <ExportsPage />
    </AppShell>
  );
}
