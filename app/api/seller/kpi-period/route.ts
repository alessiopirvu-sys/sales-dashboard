import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireSeller } from "@/lib/auth/session";
import { internalKpiRowInputSchema } from "@/lib/internal-kpi/schemas";
import {
  loadSellerPeriodRows,
  saveSellerPeriodRows
} from "@/lib/internal-kpi/repository";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const periodPayloadSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12)
});

const savePayloadSchema = periodPayloadSchema.extend({
  rows: z.array(internalKpiRowInputSchema)
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const context = await requireSeller();
    const parsed = periodPayloadSchema.safeParse({
      year: request.nextUrl.searchParams.get("year"),
      month: request.nextUrl.searchParams.get("month")
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "INVALID_PERIOD",
          message: "Periodo non valido."
        },
        { status: 400 }
      );
    }

    const data = await loadSellerPeriodRows(
      context.supabase,
      context.seller.id,
      parsed.data.year,
      parsed.data.month
    );

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "SELLER_KPI_LOAD_ERROR",
        message: error instanceof Error ? error.message : "Errore durante il caricamento del periodo KPI."
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const context = await requireSeller();
    const payload = await request.json();
    const parsed = savePayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "INVALID_KPI_PAYLOAD",
          message: parsed.error.issues[0]?.message ?? "Payload KPI non valido."
        },
        { status: 400 }
      );
    }

    const period = await saveSellerPeriodRows(getSupabaseAdmin(), {
      sellerId: context.seller.id,
      year: parsed.data.year,
      month: parsed.data.month,
      actorUserId: context.user.id,
      rows: parsed.data.rows
    });

    return NextResponse.json({
      success: true,
      reportingPeriodId: period.id,
      status: period.status
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "SELLER_KPI_SAVE_ERROR",
        message: error instanceof Error ? error.message : "Errore durante il salvataggio dei KPI."
      },
      { status: 500 }
    );
  }
}
