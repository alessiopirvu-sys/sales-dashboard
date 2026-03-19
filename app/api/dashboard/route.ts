import { NextRequest, NextResponse } from "next/server";

import { getDashboardData } from "@/lib/data/dashboard-service";
import { parseFiltersFromSearchParams } from "@/lib/data/filters";

export async function GET(request: NextRequest) {
  try {
    const filters = parseFiltersFromSearchParams(request.nextUrl.searchParams);
    const data = await getDashboardData(filters);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Errore interno durante il caricamento dei KPI.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
