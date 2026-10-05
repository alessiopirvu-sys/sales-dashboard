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
  months: { id: string; year: number; month: number; monthLabel: string; targetTotal: number }[];
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

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const context = await requireActiveProfile();
    const supabase = context.isDevMode ? getSupabaseAdmin() : context.supabase;

    // Senza ?year=&month= il database sceglie il mese corrente (o il piu' recente).
    const searchParams = new URL(request.url).searchParams;
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));
    const hasMonth = Number.isInteger(year) && year >= 2000 && year <= 2100 && Number.isInteger(month) && month >= 1 && month <= 12;

    const { data, error } = await supabase.rpc("get_team_sales_month", {
      p_team_id: params.teamId,
      ...(hasMonth ? { p_year: year, p_month: month } : {})
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
      months: (payload.months ?? []).map((row) => ({
        id: row.id,
        year: row.year,
        month: row.month,
        monthLabel: row.monthLabel,
        targetTotal: Number(row.targetTotal || 0)
      })),
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
