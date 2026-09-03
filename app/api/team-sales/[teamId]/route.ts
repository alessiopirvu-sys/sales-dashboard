import { NextRequest, NextResponse } from "next/server";

import { requireActiveProfile, requireAdmin } from "@/lib/auth/session";
import { AppError, toPublicError } from "@/lib/auth/errors";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { TeamSalesMonthData } from "@/lib/team-sales/types";
import { createTeamSalesTeamSchema } from "@/lib/team-sales/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteParams = { params: { teamId: string } };

type TeamSalesMonthRow = {
  id: string;
  month_label: string;
  year: number;
  month: number;
  working_days: number;
  target_total: number;
};

type TeamSalesMonthPayload = {
  team: { id: string; name: string } | null;
  month: TeamSalesMonthRow | null;
  sellers: { id: string; sellerId: string | null; name: string; target: number }[];
  entries: { sellerName: string; saleDate: string; amount: number }[];
  pending: {
    id: string;
    client: string;
    sellerName: string;
    value: number;
    phase: string | null;
    closeDate: string | null;
    notes: string | null;
  }[];
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const context = await requireActiveProfile();
    const supabase = context.isDevMode ? getSupabaseAdmin() : context.supabase;

    const { data, error } = await supabase.rpc("get_team_sales_month", {
      p_team_id: params.teamId
    });

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Impossibile caricare i dati della squadra.");
    }

    const payload = data as TeamSalesMonthPayload | null;

    if (!payload?.team) {
      throw new AppError("VALIDATION_ERROR", "Squadra non trovata.", 404);
    }

    const now = new Date();

    const result: TeamSalesMonthData = {
      teamId: payload.team.id,
      teamMonthId: payload.month?.id ?? null,
      setup: {
        teamName: payload.team.name,
        monthLabel: payload.month?.month_label ?? "",
        year: payload.month?.year ?? now.getFullYear(),
        month: payload.month?.month ?? now.getMonth() + 1,
        targetTotal: Number(payload.month?.target_total ?? 0),
        workingDays: Number(payload.month?.working_days ?? 21),
        sellers: (payload.sellers ?? []).map((seller) => ({
          id: seller.id,
          sellerId: seller.sellerId,
          name: seller.name,
          target: Number(seller.target || 0)
        }))
      },
      entries: (payload.entries ?? []).map((entry) => ({
        sellerName: entry.sellerName,
        saleDate: entry.saleDate,
        amount: Number(entry.amount || 0)
      })),
      pending: (payload.pending ?? []).map((row) => ({
        id: row.id,
        client: row.client,
        sellerName: row.sellerName,
        value: Number(row.value || 0),
        phase: row.phase ?? "",
        closeDate: row.closeDate,
        notes: row.notes ?? ""
      }))
    };

    return NextResponse.json(result);
  } catch (error) {
    const response = toPublicError(error, "Errore durante il caricamento della squadra.");
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
      .update({ name: parsed.data.name })
      .eq("id", params.teamId)
      .select("id,name")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new AppError("CONFLICT", "Esiste gia' una squadra con questo nome.");
      }
      throw new AppError("INTERNAL_ERROR", "Impossibile rinominare la squadra.");
    }

    if (!data) {
      throw new AppError("VALIDATION_ERROR", "Squadra non trovata.", 404);
    }

    return NextResponse.json({ team: data });
  } catch (error) {
    const response = toPublicError(error, "Errore durante la rinomina della squadra.");
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const context = await requireAdmin();
    const supabase = context.isDevMode ? getSupabaseAdmin() : context.supabase;

    const { error } = await supabase.from("team_sales_teams").delete().eq("id", params.teamId);

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Impossibile eliminare la squadra.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const response = toPublicError(error, "Errore durante l'eliminazione della squadra.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
