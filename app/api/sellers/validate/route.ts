import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { INVALID_SHEETS_CSV_MESSAGE, isValidGoogleSheetsCsvUrl } from "@/lib/google-sheets-url";
import { validateSellerSheetUrl } from "@/lib/sheets-csv";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const payload = (await request.json()) as { sheetUrl?: string };

    if (!payload.sheetUrl?.trim()) {
      return NextResponse.json({ error: "Il Google Sheets CSV URL è obbligatorio." }, { status: 400 });
    }

    if (!isValidGoogleSheetsCsvUrl(payload.sheetUrl.trim())) {
      return NextResponse.json(
        {
          valid: false,
          message: INVALID_SHEETS_CSV_MESSAGE
        },
        { status: 422 }
      );
    }

    const result = await validateSellerSheetUrl(payload.sheetUrl.trim());
    return NextResponse.json(result, { status: result.valid ? 200 : 422 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore verifica foglio.";
    return NextResponse.json(
      {
        valid: false,
        message
      },
      { status: 500 }
    );
  }
}
