import { AssistantHomePage } from "@/components/home/assistant-home-page";
import { AppShell } from "@/components/layout/AppShell";
import { getViewerDisplayName, requireAdmin } from "@/lib/auth/session";

export default async function HomeRoute() {
  const context = await requireAdmin();

  return (
    <AppShell
      role="admin"
      displayName={getViewerDisplayName(context.profile)}
      roleLabel="Admin"
      devMode={context.isDevMode}
    >
      <AssistantHomePage />
    </AppShell>
  );
}
