import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { AppError, toPublicError } from "@/lib/auth/errors";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteParams = { params: { teamId: string; monthId: string } };

// Elimina un mese con i suoi venditori, obiettivi e pending (cascade).
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const context = await requireAdmin();
    const supabase = context.isDevMode ? getSupabaseAdmin() : context.supabase;

    const { data, error } = await supabase
      .from("team_sales_months")
      .delete()
      .eq("id", params.monthId)
      .eq("team_id", params.teamId)
      .select("id");

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Impossibile eliminare il mese.");
    }

    if (!data || data.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Mese non trovato.", 404);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const response = toPublicError(error, "Errore durante l'eliminazione del mese.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
