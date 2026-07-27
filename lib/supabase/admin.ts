import "server-only";

import { createClient } from "@supabase/supabase-js";

type UntypedDatabase = any;

let adminClient: ReturnType<typeof createClient<UntypedDatabase>> | null = null;

export function getSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("La variabile SUPABASE_SERVICE_ROLE_KEY non e configurata.");
  }

  if (!adminClient) {
    adminClient = createClient<UntypedDatabase>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return adminClient;
}
