import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/components/dashboard/dashboard-page";

export default function DashboardRoute() {
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  );
}
