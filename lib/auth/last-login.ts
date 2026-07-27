import { createClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/auth/errors";

type SessionCapableClient = {
  auth: {
    getSession: () => Promise<{
      data: {
        session: {
          access_token: string;
        } | null;
      };
      error: { message: string } | null;
    }>;
  };
};

export async function touchCurrentLastLogin(supabase: SessionCapableClient) {
  const { data, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !data.session?.access_token) {
    throw new AppError("UNAUTHENTICATED", "Sessione utente non disponibile.");
  }

  const rpcClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`
      }
    }
  });

  const { error } = await rpcClient.rpc("touch_current_last_login");

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Aggiornamento ultimo accesso non riuscito.");
  }
}
