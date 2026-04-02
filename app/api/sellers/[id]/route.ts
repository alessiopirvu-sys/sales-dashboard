import { NextRequest, NextResponse } from "next/server";

import { INVALID_SHEETS_CSV_MESSAGE, isValidGoogleSheetsCsvUrl } from "@/lib/google-sheets-url";
import { getSupabaseAdmin } from "@/lib/supabase/server";

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

    if (message.includes("sheet_url_april")) {
      return "Manca la colonna sheet_url_april nel database. Esegui la nuova migration di Supabase.";
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

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("sellers").delete().eq("id", params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = getErrorMessage(error, "Errore eliminazione venditore.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const body = await request.json();
    const name = body?.name?.trim();
    const sheetUrl = body?.sheetUrl?.trim();
    const aprilSheetUrl = body?.aprilSheetUrl?.trim() || null;

    if (!name || !sheetUrl) {
      return NextResponse.json({ error: "Name and sheetUrl are required" }, { status: 400 });
    }

    if (!isValidGoogleSheetsCsvUrl(sheetUrl)) {
      return NextResponse.json({ error: INVALID_SHEETS_CSV_MESSAGE }, { status: 400 });
    }

    if (aprilSheetUrl && !isValidGoogleSheetsCsvUrl(aprilSheetUrl)) {
      return NextResponse.json(
        { error: "Il link del foglio di aprile non e valido." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("sellers")
      .update({
        name,
        sheet_url: sheetUrl,
        sheet_url_april: aprilSheetUrl
      })
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ seller: data }, { status: 200 });
  } catch (error) {
    const message = getErrorMessage(error, "Errore aggiornamento venditore.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
