import { SupabaseClient, createClient } from "@supabase/supabase-js";

type CliArgs = {
  email: string;
  password: string;
};

function parseArgs(argv: string[]): CliArgs {
  const args = new Map<string, string>();

  for (const rawArg of argv) {
    const [key, ...rest] = rawArg.split("=");
    const value = rest.join("=");

    if (key.startsWith("--") && value) {
      args.set(key.slice(2), value);
    }
  }

  const email = args.get("email") ?? process.env.TARGET_USER_EMAIL;
  const password = args.get("password") ?? process.env.TARGET_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Parametri mancanti. Usa --email=... --password=... oppure TARGET_USER_EMAIL e TARGET_USER_PASSWORD."
    );
  }

  return { email, password };
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`La variabile ${name} non e configurata.`);
  }

  return value;
}

async function findUserByEmail(
  supabase: SupabaseClient,
  email: string
) {
  const perPage = 200;
  let page = 1;

  while (true) {
    const response = await supabase.auth.admin.listUsers({ page, perPage });

    if (response.error) {
      throw new Error(`Impossibile leggere gli utenti Auth: ${response.error.message}`);
    }

    const user = response.data.users.find(
      (entry) => entry.email?.toLowerCase() === email.toLowerCase()
    );

    if (user) {
      return user;
    }

    if (response.data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function main() {
  const { email, password } = parseArgs(process.argv.slice(2));
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const user = await findUserByEmail(supabase, email);

  if (!user) {
    throw new Error("Utente Auth non trovato.");
  }

  const result = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true
  });

  if (result.error) {
    throw new Error(`Aggiornamento password non riuscito: ${result.error.message}`);
  }

  process.stdout.write(`Password aggiornata per ${email}.\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Errore sconosciuto";
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
