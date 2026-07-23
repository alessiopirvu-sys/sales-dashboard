import { NextRequest, NextResponse } from "next/server";

import {
  getDuplicateSellerSheetError,
  INVALID_SHEETS_CSV_MESSAGE,
  isValidGoogleSheetsCsvUrl
} from "@/lib/google-sheets-url";
import { buildSellerSheetsPayload, getFirstSellerSheetUrl } from "@/lib/seller-sheets";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SellerSheetsMap } from "@/lib/types";

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
    const sheets = buildSellerSheetsPayload(body?.sheets as SellerSheetsMap | undefined);
    const sheetUrl = getFirstSellerSheetUrl(sheets);

    if (!name || !sheetUrl) {
      return NextResponse.json(
        { error: "Name and at least one monthly sheet are required" },
        { status: 400 }
      );
    }

    for (const [key, url] of Object.entries(sheets)) {
      if (!isValidGoogleSheetsCsvUrl(url)) {
        return NextResponse.json(
          { error: `Il link del foglio ${key} non e valido.` },
          { status: 400 }
        );
      }
    }

    const duplicateSheetError = getDuplicateSellerSheetError([
      ...Object.entries(sheets).map(([key, url]) => ({ label: key, url }))
    ]);

    if (duplicateSheetError) {
      return NextResponse.json({ error: duplicateSheetError }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("sellers")
      .update({
        name,
        sheet_url: sheetUrl,
        sheets
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
