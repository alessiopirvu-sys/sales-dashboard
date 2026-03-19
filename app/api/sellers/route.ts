import { NextRequest, NextResponse } from "next/server";
import { INVALID_SHEETS_CSV_MESSAGE, isValidGoogleSheetsCsvUrl } from "@/lib/google-sheets-url";
import { supabaseServer } from "@/lib/supabase/server";

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

    if (!name || !sheetUrl) {
      return NextResponse.json(
        { error: "Name and sheetUrl are required" },
        { status: 400 }
      );
    }

    if (!isValidGoogleSheetsCsvUrl(sheetUrl)) {
      return NextResponse.json({ error: INVALID_SHEETS_CSV_MESSAGE }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("sellers")
      .insert([{ name, sheet_url: sheetUrl, is_active: true }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ seller: data });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
