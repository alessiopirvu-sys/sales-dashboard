import { NextRequest, NextResponse } from "next/server";

import { requireActiveProfile, requireAdmin } from "@/lib/auth/session";
import { AppError, toPublicError } from "@/lib/auth/errors";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createTeamSalesTeamSchema } from "@/lib/team-sales/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const context = await requireActiveProfile();
    const supabase = context.isDevMode ? getSupabaseAdmin() : context.supabase;

    const { data, error } = await supabase
      .from("team_sales_teams")
      .select("id,name")
      .order("created_at", { ascending: true });

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Impossibile caricare le squadre Team Sales.");
    }

    let myTeamIds: string[] = [];
    if (context.profile.role === "seller" && context.seller) {
      const { data: myTeamIdsData, error: myTeamIdsError } = await supabase.rpc(
        "get_my_team_sales_team_ids",
        { p_seller_id: context.seller.id }
      );
      if (!myTeamIdsError) {
        myTeamIds = (myTeamIdsData ?? []) as string[];
      }
    }

    return NextResponse.json({ teams: data ?? [], myTeamIds });
  } catch (error) {
    const response = toPublicError(error, "Errore durante il caricamento delle squadre.");
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAdmin();
    const supabase = context.isDevMode ? getSupabaseAdmin() : context.supabase;
    const body = await request.json();
    const parsed = createTeamSalesTeamSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Nome squadra non valido.");
    }

    const { data, error } = await supabase
      .from("team_sales_teams")
      .insert({ name: parsed.data.name })
      .select("id,name")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new AppError("CONFLICT", "Esiste gia' una squadra con questo nome.");
      }
      throw new AppError("INTERNAL_ERROR", "Impossibile creare la squadra.");
    }

    return NextResponse.json({ team: data }, { status: 201 });
  } catch (error) {
    const response = toPublicError(error, "Errore durante la creazione della squadra.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
