import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

import { AppError, toPublicError } from "@/lib/auth/errors";
import { isPasswordChangeRequired, resolvePostAuthRedirect } from "@/lib/auth/password-policy";
import { touchCurrentLastLogin } from "@/lib/auth/last-login";
import { resolvePostLoginPath } from "@/lib/auth/navigation";
import { requireActiveProfile } from "@/lib/auth/session";

const sessionPayloadSchema = z
  .object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    nextPath: z.string().optional()
  })
  .strict();

function createRouteSupabaseClient(request: NextRequest, response: NextResponse) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  try {
    const payload = sessionPayloadSchema.parse(await request.json());
    const supabase = createRouteSupabaseClient(request, response);

    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: payload.accessToken,
      refresh_token: payload.refreshToken
    });

    if (setSessionError) {
      throw new AppError("UNAUTHENTICATED", "La sessione di accesso non e valida.");
    }

    const context = await requireActiveProfile(supabase);

    if (context.profile.role === "seller" && !context.seller) {
      throw new AppError("SELLER_NOT_LINKED", "Nessun venditore collegato.");
    }

    try {
      await touchCurrentLastLogin(supabase);
    } catch (error) {
      console.error("Aggiornamento last_login_at non riuscito", error);
    }

    const redirectTo = resolvePostAuthRedirect(
      context.profile.role,
      payload.nextPath,
      isPasswordChangeRequired(context.user.user_metadata),
      resolvePostLoginPath
    );
    const finalResponse = NextResponse.json({ success: true, redirectTo }, { status: 200 });

    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie);
    });

    return finalResponse;
  } catch (error) {
    const publicError = toPublicError(error, "Non e stato possibile completare la sessione.");
    return NextResponse.json(publicError.body, { status: publicError.status });
  }
}
