import { NextResponse } from "next/server";

import { requireActiveProfile } from "@/lib/auth/session";
import { AppError, toPublicError } from "@/lib/auth/errors";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { teamSalesSavePayloadSchema } from "@/lib/team-sales/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteParams = { params: { teamId: string } };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const context = await requireActiveProfile();
    const supabase = context.isDevMode ? getSupabaseAdmin() : context.supabase;
    const body = await request.json();
    const parsed = teamSalesSavePayloadSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Dati non validi.");
    }

    const { data, error } = await supabase.rpc("save_team_sales_month", {
      p_team_id: params.teamId,
      p_team_month_id: parsed.data.teamMonthId,
      payload: {
        monthLabel: parsed.data.setup.monthLabel,
        year: parsed.data.setup.year,
        month: parsed.data.setup.month,
        workingDays: parsed.data.setup.workingDays,
        targetTotal: parsed.data.setup.targetTotal,
        sellers: parsed.data.setup.sellers,
        pending: parsed.data.pending
      }
    });

    if (error) {
      throw new AppError("INTERNAL_ERROR", `Salvataggio fallito: ${error.message}`);
    }

    return NextResponse.json({ success: true, ...(data as Record<string, unknown>) });
  } catch (error) {
    const response = toPublicError(error, "Errore durante il salvataggio.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
