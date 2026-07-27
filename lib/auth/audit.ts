import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

type AuditPayload = {
  actorProfileId: string;
  sellerId: string;
  action: string;
  metadata?: Record<string, unknown>;
  reportingPeriodId?: string | null;
  sellerDailyKpiId?: string | null;
};

export async function insertSellerAuditLog({
  actorProfileId,
  sellerId,
  action,
  metadata,
  reportingPeriodId,
  sellerDailyKpiId
}: AuditPayload) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("seller_kpi_audit_logs").insert({
    seller_id: sellerId,
    reporting_period_id: reportingPeriodId ?? null,
    seller_daily_kpi_id: sellerDailyKpiId ?? null,
    actor_profile_id: actorProfileId,
    event_type: action,
    payload: metadata ?? {}
  });

  if (error) {
    throw new Error(`Impossibile registrare l'audit log: ${error.message}`);
  }
}
