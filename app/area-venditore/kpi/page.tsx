import { AppShell } from "@/components/layout/AppShell";
import { KpiSpreadsheet } from "@/components/kpi/KpiSpreadsheet";
import { getViewerDisplayName, requireSeller } from "@/lib/auth/session";

export default async function SellerKpiPage() {
  const context = await requireSeller();
  const displayName = getViewerDisplayName(context.profile, context.seller);

  return (
    <AppShell role="seller" displayName={displayName} roleLabel="Seller" devMode={context.isDevMode}>
      <main className="mx-auto flex h-[calc(100vh-5rem)] w-full max-w-[calc(100vw-8rem)] flex-col xl:max-w-[1600px]">
        <KpiSpreadsheet sellerName={displayName} />
      </main>
    </AppShell>
  );
}
