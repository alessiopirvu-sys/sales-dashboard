import { NextRequest, NextResponse } from "next/server";
import { INVALID_SHEETS_CSV_MESSAGE, isValidGoogleSheetsCsvUrl } from "@/lib/google-sheets-url";
import { supabaseServer } from "@/lib/supabase/server";

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

export async function GET() {
  const { data, error } = await supabaseServer
    .from("sellers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sellers: data ?? [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body?.name?.trim();
    const sheetUrl = body?.sheetUrl?.trim();
    const aprilSheetUrl = body?.aprilSheetUrl?.trim() || null;

    if (!name || !sheetUrl) {
      return NextResponse.json(
        { error: "Name and sheetUrl are required" },
        { status: 400 }
      );
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

    const { data, error } = await supabaseServer
      .from("sellers")
      .insert([
        {
          name,
          sheet_url: sheetUrl,
          sheet_url_april: aprilSheetUrl,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ seller: data });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unexpected server error") },
      { status: 500 }
    );
  }
}
