import { NextRequest, NextResponse } from "next/server";
import { rollbackSellerCoreSnapshot, syncSellerPlatformAccess } from "@/lib/auth/admin-seller";
import { AppError, toPublicError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/session";
import { buildSellerSheetsPayload } from "@/lib/seller-sheets";
import { isSellerAccessConfigurationEmpty, sellerUpsertRequestSchema } from "@/lib/sellers/access";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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

type RouteContext = {
  params: {
    id: string;
  };
};

function buildArchivedSellerName(name: string) {
  return `[archived] ${name} ${new Date().toISOString()}`;
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const context = await requireAdmin();
    const supabase = context.isDevMode ? getSupabaseAdmin() : getSupabaseAdmin();
    const { data: seller, error: sellerLookupError } = await supabase
      .from("sellers")
      .select("id,name,profile_id")
      .eq("id", params.id)
      .maybeSingle<{ id: string; name: string; profile_id: string | null }>();

    if (sellerLookupError) {
      throw new AppError(
        "INTERNAL_ERROR",
        `Verifica venditore non riuscita: ${sellerLookupError.message}`
      );
    }

    if (!seller) {
      throw new AppError("FORBIDDEN", "Venditore non trovato.", 404);
    }

    let linkedProfileRole: "admin" | "seller" | null = null;
    if (seller.profile_id) {
      const { data: linkedProfile, error: linkedProfileError } = await supabase
        .from("profiles")
        .select("id,role")
        .eq("id", seller.profile_id)
        .maybeSingle<{ id: string; role: "admin" | "seller" }>();

      if (linkedProfileError) {
        console.error("[api/sellers/:id][DELETE] profile lookup failed", {
          sellerId: seller.id,
          profileId: seller.profile_id,
          message: linkedProfileError.message
        });
      } else {
        linkedProfileRole = linkedProfile?.role ?? null;
      }
    }

    const { error } = await supabase
      .from("sellers")
      .update({
        name: buildArchivedSellerName(seller.name),
        profile_id: null,
        first_name: null,
        last_name: null,
        email: null,
        status: "disabled",
        is_active: false,
        last_login_at: null,
        sheets: {}
      })
      .eq("id", seller.id);

    if (error) {
      throw new AppError("INTERNAL_ERROR", `Archiviazione venditore non riuscita: ${error.message}`);
    }

    if (seller.profile_id && linkedProfileRole === "seller") {
      const authDeletion = await supabase.auth.admin.deleteUser(seller.profile_id);

      if (authDeletion.error) {
        console.error("[api/sellers/:id][DELETE] auth cleanup failed", {
          sellerId: seller.id,
          profileId: seller.profile_id,
          message: authDeletion.error.message
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const response = toPublicError(error, getErrorMessage(error, "Errore eliminazione venditore."));
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const context = await requireAdmin();
    const supabase = context.isDevMode ? getSupabaseAdmin() : context.supabase;
    const body = await request.json();
    const parsed = sellerUpsertRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Dati venditore non validi.");
    }

    const sellerSnapshotResponse = await supabase
      .from("sellers")
      .select("id,name,sheet_url,sheets")
      .eq("id", params.id)
      .maybeSingle();

    if (sellerSnapshotResponse.error) {
      throw sellerSnapshotResponse.error;
    }

    if (!sellerSnapshotResponse.data) {
      throw new AppError("FORBIDDEN", "Venditore non trovato.", 404);
    }

    const name = parsed.data.name.trim();
    const sheets = buildSellerSheetsPayload(parsed.data.sheets);

    if (!name) {
      return NextResponse.json({ error: "Il nome del venditore e obbligatorio." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("sellers")
      .update({
        name,
        sheets
      })
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    try {
      if (parsed.data.access && !isSellerAccessConfigurationEmpty(parsed.data.access)) {
        await syncSellerPlatformAccess(params.id, context.profile.id, name, parsed.data.access);
      }
    } catch (error) {
      await rollbackSellerCoreSnapshot({
        id: sellerSnapshotResponse.data.id,
        name: sellerSnapshotResponse.data.name,
        sheet_url: sellerSnapshotResponse.data.sheet_url,
        sheets: sellerSnapshotResponse.data.sheets as Record<string, string> | null
      });
      throw error;
    }

    return NextResponse.json({ seller: data }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.info("[api/sellers/:id][PATCH] request rejected", {
        sellerId: params.id,
        error: error instanceof Error ? error.message : "unknown"
      });
    }
    const response = toPublicError(error, getErrorMessage(error, "Errore aggiornamento venditore."));
    return NextResponse.json(response.body, { status: response.status });
  }
}
