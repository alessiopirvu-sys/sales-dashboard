import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { applyRateLimit } from "@/lib/rate-limit";

const schema = z
  .object({
    email: z.string().trim().email()
  })
  .strict();

export async function POST(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "local";
  const rateLimit = applyRateLimit(`reset-password:${forwardedFor}`, 5, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: true,
        message:
          "Se l'account esiste e puo ricevere il reset, abbiamo inviato le istruzioni alla casella indicata."
      },
      { status: 200 }
    );
  }

  try {
    const payload = schema.parse(await request.json());
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    await supabase.auth.resetPasswordForEmail(payload.email, {
      redirectTo: `${request.nextUrl.origin}/auth/callback?next=/update-password`
    });
  } catch {
    // Risposta volutamente generica.
  }

  return NextResponse.json(
    {
      success: true,
      message:
        "Se l'account esiste e puo ricevere il reset, abbiamo inviato le istruzioni alla casella indicata."
    },
    { status: 200 }
  );
}
