import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  DEV_AUTH_ROLE_COOKIE,
  getEffectiveDevAuthRole,
  isDevAuthBypassEnabled
} from "@/lib/auth/dev-mode";

const devRoleSchema = z
  .object({
    role: z.enum(["admin", "seller"])
  })
  .strict();

export async function POST(request: NextRequest) {
  if (!isDevAuthBypassEnabled()) {
    return NextResponse.json(
      {
        error: "FORBIDDEN",
        message: "La DEV MODE non e disponibile in questo ambiente."
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = devRoleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Ruolo DEV non valido."
      },
      { status: 400 }
    );
  }

  const role = getEffectiveDevAuthRole(parsed.data.role);
  const response = NextResponse.json({
    role,
    redirectTo: role === "admin" ? "/dashboard" : "/area-venditore/kpi"
  });

  response.cookies.set({
    name: DEV_AUTH_ROLE_COOKIE,
    value: role,
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
