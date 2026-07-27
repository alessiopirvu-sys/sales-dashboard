"use client";

import { createBrowserClient } from "@supabase/ssr";

type UntypedDatabase = any;

let browserClient: ReturnType<typeof createBrowserClient<UntypedDatabase>> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<UntypedDatabase>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return browserClient;
}
