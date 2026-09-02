import { NextResponse } from "next/server";

import { requireActiveProfile } from "@/lib/auth/session";
import { AppError, toPublicError } from "@/lib/auth/errors";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { TeamSalesOverviewRow } from "@/lib/team-sales/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const context = await requireActiveProfile();
    const supabase = context.isDevMode ? getSupabaseAdmin() : context.supabase;

    const { data, error } = await supabase.rpc("get_team_sales_overview");

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Impossibile caricare la panoramica delle squadre.");
    }

    return NextResponse.json({ teams: (data ?? []) as TeamSalesOverviewRow[] });
  } catch (error) {
    const response = toPublicError(error, "Errore durante il caricamento della panoramica.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
