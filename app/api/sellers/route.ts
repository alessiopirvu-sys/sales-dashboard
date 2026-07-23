import { NextRequest, NextResponse } from "next/server";
import {
  getDuplicateSellerSheetError,
  INVALID_SHEETS_CSV_MESSAGE,
  isValidGoogleSheetsCsvUrl
} from "@/lib/google-sheets-url";
import {
  buildSellerSheetsPayload,
  getFirstSellerSheetUrl,
  getSellerSheetsMap
} from "@/lib/seller-sheets";
import { supabaseServer } from "@/lib/supabase/server";
import { SellerSheetsMap } from "@/lib/types";

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

  const rawSellers = data ?? [];
  const sellers = rawSellers.map((seller) => ({
    ...seller,
    sheets: getSellerSheetsMap(seller)
  }));

  const sellersToMigrate = sellers.filter(
    (seller) =>
      JSON.stringify(buildSellerSheetsPayload(rawSellers.find((rawSeller) => rawSeller.id === seller.id)?.sheets)) !==
      JSON.stringify(buildSellerSheetsPayload(seller.sheets))
  );

  if (sellersToMigrate.length > 0) {
    await Promise.allSettled(
      sellersToMigrate.map((seller) =>
        supabaseServer.from("sellers").update({ sheets: buildSellerSheetsPayload(seller.sheets) }).eq("id", seller.id)
      )
    );
  }

  return NextResponse.json(
    { sellers },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    const { data, error } = await supabaseServer
      .from("sellers")
      .insert([
        {
          name,
          sheet_url: sheetUrl,
          sheets,
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
