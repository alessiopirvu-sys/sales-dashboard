import { NextRequest, NextResponse } from "next/server";

import { toPublicError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/session";
import { toggleSellerAccountStatus } from "@/lib/auth/admin-seller";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const context = await requireAdmin();
    if (context.isDevMode) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "Aggiornamento stato account non disponibile in DEV MODE simulata."
        },
        { status: 403 }
      );
    }

    const payload = await request.json();
    const result = await toggleSellerAccountStatus(params.id, context.profile.id, payload);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const response = toPublicError(error, "Aggiornamento stato account non riuscito.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
