import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = request.nextUrl.searchParams.get("next");

  if (code) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const target = nextPath ? `/auth/post-login?next=${encodeURIComponent(nextPath)}` : "/auth/post-login";
  return NextResponse.redirect(new URL(target, request.url));
}
