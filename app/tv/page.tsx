import { requireAdmin } from "@/lib/auth/session";
import { TvDashboard } from "@/components/tv/TvDashboard";

// Pagina pensata per restare aperta su una TV/monitor da sala: niente
// AppShell/sidebar di proposito, solo il contenuto a schermo intero.
export default async function TvRoute() {
  await requireAdmin();

  return <TvDashboard />;
}
