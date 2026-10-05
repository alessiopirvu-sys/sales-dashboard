import { createUserDb } from "@/lib/db/client";

type AuthLikeClient = {
  auth: {
    getUser: (...args: any[]) => Promise<any>;
    setSession: (...args: any[]) => Promise<any>;
    signOut: (...args: any[]) => Promise<any>;
    [key: string]: any;
  };
};

/**
 * Unisce un client Supabase (usato SOLO per l'autenticazione) con l'accesso ai
 * dati su Postgres/Railway. Espone la stessa forma di prima: `.auth.*`,
 * `.from()` e `.rpc()`; le query girano con l'utente della sessione corrente
 * (RLS attiva).
 */
export function withUserDb<T extends AuthLikeClient>(authClient: T) {
  let userPromise: Promise<any> | null = null;

  const originalGetUser = authClient.auth.getUser.bind(authClient.auth);
  const originalSetSession = authClient.auth.setSession.bind(authClient.auth);
  const originalSignOut = authClient.auth.signOut.bind(authClient.auth);

  // getUser() senza argomenti viene riusato per tutta la durata della richiesta:
  // evita una chiamata di rete a Supabase per ogni query sul database.
  authClient.auth.getUser = (...args: any[]) => {
    if (args.length > 0) {
      return originalGetUser(...args);
    }

    if (!userPromise) {
      userPromise = originalGetUser();
    }

    return userPromise;
  };
  authClient.auth.setSession = (...args: any[]) => {
    userPromise = null;
    return originalSetSession(...args);
  };
  authClient.auth.signOut = (...args: any[]) => {
    userPromise = null;
    return originalSignOut(...args);
  };

  const db = createUserDb(async () => {
    const { data, error } = await authClient.auth.getUser();
    const user = data?.user;

    if (error || !user) {
      return null;
    }

    return { sub: user.id as string, email: (user.email as string | undefined) ?? null };
  });

  return Object.assign(authClient, { from: db.from, rpc: db.rpc }) as T & {
    from: typeof db.from;
    rpc: typeof db.rpc;
  };
}
