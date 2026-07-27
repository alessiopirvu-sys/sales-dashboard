import { NextRequest, NextResponse } from "next/server";

import { toPublicError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/session";
import { unlinkSellerProfile } from "@/lib/auth/admin-seller";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const context = await requireAdmin();
    if (context.isDevMode) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "Scollegamento account non disponibile in DEV MODE simulata."
        },
        { status: 403 }
      );
    }

    const result = await unlinkSellerProfile(params.id, context.profile.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const response = toPublicError(error, "Scollegamento account non riuscito.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
