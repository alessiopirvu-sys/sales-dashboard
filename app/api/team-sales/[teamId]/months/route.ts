import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { AppError, toPublicError } from "@/lib/auth/errors";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createTeamSalesMonthSchema } from "@/lib/team-sales/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteParams = { params: { teamId: string } };

// Aggiunge un nuovo mese alla squadra, opzionalmente copiando venditori e
// obiettivi personali da un mese esistente.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await requireAdmin();
    const supabase = context.isDevMode ? getSupabaseAdmin() : context.supabase;
    const parsed = createTeamSalesMonthSchema.safeParse(await request.json());

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Mese non valido.");
    }

    const { data, error } = await supabase.rpc("create_team_sales_month", {
      p_team_id: params.teamId,
      p_year: parsed.data.year,
      p_month: parsed.data.month,
      p_copy_from: parsed.data.copyFromMonthId ?? null
    });

    if (error) {
      if (error.code === "23505") {
        throw new AppError("CONFLICT", "Questo mese esiste gia' per la squadra.");
      }
      throw new AppError("INTERNAL_ERROR", "Impossibile creare il mese.");
    }

    return NextResponse.json({ success: true, ...(data as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    const response = toPublicError(error, "Errore durante la creazione del mese.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
