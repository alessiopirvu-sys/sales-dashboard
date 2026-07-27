import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();

  const code = request.nextUrl.searchParams.get("code");
  const target = code ? `/auth/error?code=${encodeURIComponent(code)}` : "/login";
  return NextResponse.redirect(new URL(target, request.url));
}
