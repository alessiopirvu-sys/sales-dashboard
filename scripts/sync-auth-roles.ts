/**
 * Copia il ruolo di ogni profilo (tabella `profiles` su Postgres/Railway) in
 * `app_metadata.role` dell'utente su Supabase Auth. Il middleware (Edge) non puo'
 * interrogare il database e legge il ruolo da li'.
 *
 * Da eseguire una volta dopo la migrazione (e sicuro rilanciarlo):
 *   npm run sync:auth-roles
 * Richiede DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";

import { createAdminDb } from "../lib/db/client";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`La variabile ${name} non e configurata.`);
  }

  return value;
}

async function main() {
  const supabase = createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profiles, error } = await createAdminDb().from("profiles").select("id,role,email");

  if (error) {
    throw new Error(`Impossibile leggere i profili: ${error.message}`);
  }

  let updated = 0;
  let unchanged = 0;
  const failed: string[] = [];

  for (const profile of profiles ?? []) {
    const current = await supabase.auth.admin.getUserById(profile.id);

    if (current.error || !current.data.user) {
      failed.push(`${profile.email ?? profile.id}: utente Auth non trovato`);
      continue;
    }

    if (current.data.user.app_metadata?.role === profile.role) {
      unchanged += 1;
      continue;
    }

    const result = await supabase.auth.admin.updateUserById(profile.id, {
      app_metadata: { ...current.data.user.app_metadata, role: profile.role }
    });

    if (result.error) {
      failed.push(`${profile.email ?? profile.id}: ${result.error.message}`);
      continue;
    }

    updated += 1;
    process.stdout.write(`ruolo ${profile.role} impostato per ${profile.email ?? profile.id}\n`);
  }

  process.stdout.write(`\nAggiornati: ${updated}, gia' corretti: ${unchanged}, errori: ${failed.length}\n`);
  failed.forEach((message) => process.stderr.write(`  - ${message}\n`));
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Errore sconosciuto"}\n`);
  process.exit(1);
});
