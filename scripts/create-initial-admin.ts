import { createClient } from "@supabase/supabase-js";

type CliArgs = {
  email: string;
  firstName: string;
  lastName: string;
};

function parseArgs(argv: string[]): CliArgs {
  const args = new Map<string, string>();

  for (const rawArg of argv) {
    const [key, value] = rawArg.split("=");

    if (key.startsWith("--") && value) {
      args.set(key.slice(2), value);
    }
  }

  const email = args.get("email") ?? process.env.INITIAL_ADMIN_EMAIL;
  const firstName = args.get("firstName") ?? process.env.INITIAL_ADMIN_FIRST_NAME;
  const lastName = args.get("lastName") ?? process.env.INITIAL_ADMIN_LAST_NAME;

  if (!email || !firstName || !lastName) {
    throw new Error(
      "Parametri mancanti. Usa --email=... --firstName=... --lastName=... oppure le variabili INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_FIRST_NAME, INITIAL_ADMIN_LAST_NAME."
    );
  }

  return { email, firstName, lastName };
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`La variabile ${name} non e configurata.`);
  }

  return value;
}

async function main() {
  const { email, firstName, lastName } = parseArgs(process.argv.slice(2));
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const existingProfile = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile.error) {
    throw new Error(`Impossibile verificare il profilo esistente: ${existingProfile.error.message}`);
  }

  if (existingProfile.data && existingProfile.data.role !== "admin") {
    throw new Error("L'email e gia collegata a un profilo non admin. Interrompo senza sovrascrivere il ruolo.");
  }

  let page = 1;
  const perPage = 200;
  let existingUser:
    | Awaited<ReturnType<typeof supabase.auth.admin.listUsers>>["data"]["users"][number]
    | undefined;

  while (!existingUser) {
    const usersResult = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (usersResult.error) {
      throw new Error(`Impossibile leggere gli utenti Auth: ${usersResult.error.message}`);
    }

    existingUser = usersResult.data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser || usersResult.data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  let userId = existingUser?.id;

  if (!userId) {
    const inviteResult = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: firstName,
        last_name: lastName
      }
    });

    if (inviteResult.error) {
      throw new Error(`Impossibile invitare l'utente admin: ${inviteResult.error.message}`);
    }

    userId = inviteResult.data.user.id;
  }

  const upsertProfile = await supabase.from("profiles").upsert(
    {
      id: userId,
      role: "admin",
      first_name: firstName,
      last_name: lastName,
      email,
      is_active: true
    },
    {
      onConflict: "id"
    }
  );

  if (upsertProfile.error) {
    throw new Error(`Impossibile salvare il profilo admin: ${upsertProfile.error.message}`);
  }

  process.stdout.write(`Admin iniziale pronto per ${email}.\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Errore sconosciuto";
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
