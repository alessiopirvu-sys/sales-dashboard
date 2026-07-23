import { AssistantHomePage } from "@/components/home/assistant-home-page";
import { AppShell } from "@/components/layout/AppShell";

export default function HomeRoute() {
  return (
    <AppShell>
      <AssistantHomePage />
    </AppShell>
  );
}
