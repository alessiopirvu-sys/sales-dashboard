import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { withUserDb } from "@/lib/supabase/with-db";

type UntypedDatabase = any;

// Supabase serve solo per l'autenticazione (sessione via cookie). I dati
// (profiles, sellers, kpi...) stanno su Postgres/Railway: vedi lib/db.
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return withUserDb(
    createServerClient<UntypedDatabase>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            } catch {
              // In alcuni server component la mutazione cookie non e disponibile.
            }
          }
        }
      }
    )
  );
}
