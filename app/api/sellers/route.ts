import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { AppError, toPublicError } from "@/lib/auth/errors";
import { syncSellerPlatformAccess } from "@/lib/auth/admin-seller";
import { requireAdmin } from "@/lib/auth/session";
import { buildSellerSheetsPayload } from "@/lib/seller-sheets";
import { isSellerAccessConfigurationEmpty, sellerUpsertRequestSchema } from "@/lib/sellers/access";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    const message = error.message;

    if (message.includes("sheets")) {
      return "Manca la colonna sheets nel database. Esegui la nuova migration di Supabase.";
    }

    if (message.includes("sheet_url_may")) {
      return "Manca la colonna sheet_url_may nel database. Esegui la nuova migration di Supabase.";
    }

    if (message.includes("sheet_url_april")) {
      return "Manca la colonna sheet_url_april nel database. Esegui la nuova migration di Supabase.";
    }

    if (
      message.includes("profile_id") ||
      message.includes("last_login_at") ||
      message.includes("first_name") ||
      message.includes("last_name") ||
      message.includes("status")
    ) {
      return "Le colonne per l'accesso piattaforma dei venditori non sono ancora presenti nel database. Applica prima le migration auth/Supabase.";
    }

    return message;
  }

  return fallback;
}

export async function GET() {
  try {
    const context = await requireAdmin();
    const supabase = context.isDevMode ? getSupabaseAdmin() : context.supabase;
    const { data, error } = await supabase
    .from("sellers")
    .select(
      "id,name,sheet_url,sheets,sheet_url_april,sheet_url_may,is_active,profile_id,first_name,last_name,email,status,last_login_at,created_at,updated_at"
    )
    .order("created_at", { ascending: false });

    if (error) {
      throw new AppError("INTERNAL_ERROR", error.message);
    }

    const rawSellers = (data ?? []).filter(
      (seller) => typeof seller.name === "string" && !seller.name.startsWith("[archived] ")
    );
    const sellers = rawSellers.map((seller) => ({
      ...seller,
      sheets: {}
    }));

    return NextResponse.json(
      { sellers },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  } catch (error) {
    const response = toPublicError(error, "Impossibile caricare i venditori.");
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireAdmin();
    const supabase = context.isDevMode ? getSupabaseAdmin() : context.supabase;
    const body = await req.json();
    const parsed = sellerUpsertRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Dati venditore non validi.");
    }

    const name = parsed.data.name.trim();
    const sheets = buildSellerSheetsPayload(parsed.data.sheets);

    if (!name) {
      return NextResponse.json({ error: "Il nome del venditore e obbligatorio." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("sellers")
      .insert([
        {
          name,
          sheet_url: `internal://${randomUUID()}`,
          sheets,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      if (parsed.data.access && !isSellerAccessConfigurationEmpty(parsed.data.access)) {
        await syncSellerPlatformAccess(data.id, context.profile.id, name, parsed.data.access);
      }
    } catch (error) {
      await supabase.from("sellers").delete().eq("id", data.id);
      throw error;
    }

    return NextResponse.json({ seller: data });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.info("[api/sellers][POST] request rejected", {
        error: error instanceof Error ? error.message : "unknown"
      });
    }
    const response = toPublicError(error, getErrorMessage(error, "Unexpected server error"));
    return NextResponse.json(response.body, { status: response.status });
  }
}
