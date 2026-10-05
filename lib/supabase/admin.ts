import "server-only";

import { createClient } from "@supabase/supabase-js";

import { createAdminDb } from "@/lib/db/client";

type UntypedDatabase = any;

let authAdminClient: ReturnType<typeof createClient<UntypedDatabase>> | null = null;

// `.auth.admin.*` passa da Supabase (service role, solo autenticazione);
// `.from()` e `.rpc()` usano Postgres/Railway con privilegi pieni.
export function getSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("La variabile SUPABASE_SERVICE_ROLE_KEY non e configurata.");
  }

  if (!authAdminClient) {
    authAdminClient = createClient<UntypedDatabase>(
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

  const db = createAdminDb();

  return {
    auth: authAdminClient.auth,
    from: db.from,
    rpc: db.rpc
  };
}
