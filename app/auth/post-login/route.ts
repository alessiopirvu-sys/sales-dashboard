import { NextRequest, NextResponse } from "next/server";

import { AppError } from "@/lib/auth/errors";
import { isPasswordChangeRequired, resolvePostAuthRedirect } from "@/lib/auth/password-policy";
import { touchCurrentLastLogin } from "@/lib/auth/last-login";
import { resolvePostLoginPath } from "@/lib/auth/navigation";
import { requireActiveProfile } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const context = await requireActiveProfile();

    if (context.profile.role === "seller" && !context.seller) {
      throw new AppError("SELLER_NOT_LINKED", "Nessun venditore collegato.");
    }

    try {
      await touchCurrentLastLogin(context.supabase);
    } catch (error) {
      console.error("Aggiornamento last_login_at non riuscito", error);
    }

    const nextPath = request.nextUrl.searchParams.get("next");
    const destination = resolvePostAuthRedirect(
      context.profile.role,
      nextPath,
      isPasswordChangeRequired(context.user.user_metadata),
      resolvePostLoginPath
    );
    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    const code = error instanceof AppError ? error.code : "FORBIDDEN";
    return NextResponse.redirect(new URL(`/auth/exit?code=${code}`, request.url));
  }
}
