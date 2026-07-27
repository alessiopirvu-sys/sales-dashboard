import { NextRequest, NextResponse } from "next/server";

import { inviteSellerAccount } from "@/lib/auth/admin-seller";
import { toPublicError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/session";
import { applyRateLimit } from "@/lib/rate-limit";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const context = await requireAdmin();
    if (context.isDevMode) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "Invito seller non disponibile in DEV MODE simulata."
        },
        { status: 403 }
      );
    }

    const rateLimit = applyRateLimit(`invite:${context.profile.id}:${params.id}`, 5, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "Hai raggiunto il limite temporaneo di invii. Riprova tra poco."
        },
        { status: 429 }
      );
    }

    const payload = await request.json();
    const result = await inviteSellerAccount(
      params.id,
      context.profile.id,
      request.nextUrl.origin,
      payload
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const response = toPublicError(error, "Invito seller non riuscito.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
