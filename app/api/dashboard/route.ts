import { NextRequest, NextResponse } from "next/server";

import { getDashboardData } from "@/lib/data/dashboard-service";
import { parseFiltersFromSearchParams } from "@/lib/data/filters";
import { toPublicError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const filters = parseFiltersFromSearchParams(request.nextUrl.searchParams);
    const data = await getDashboardData(filters);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const response = toPublicError(error, "Errore interno durante il caricamento dei KPI.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
