import { AppShell } from "@/components/layout/AppShell";
import { SellerDashboardPage } from "@/components/dashboard/seller-dashboard-page";
import { getViewerDisplayName, requireSeller } from "@/lib/auth/session";

export default async function SellerAreaPage() {
  const context = await requireSeller();
  const displayName = getViewerDisplayName(context.profile, context.seller);

  return (
    <AppShell role="seller" displayName={displayName} roleLabel="Seller" devMode={context.isDevMode}>
      <SellerDashboardPage sellerName={displayName} />
    </AppShell>
  );
}
