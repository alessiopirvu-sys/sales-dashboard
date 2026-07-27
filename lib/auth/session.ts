import { User } from "@supabase/supabase-js";

import { AppRole } from "@/lib/internal-kpi/types";
import { getServerDevAuthRole, isDevAuthBypassEnabled } from "@/lib/auth/dev-mode";
import { AppError } from "@/lib/auth/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SessionSupabaseClient = ReturnType<typeof createSupabaseServerClient>;

function logDevAuth(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("[dev-auth]", message, details ?? {});
}

export type AuthProfile = {
  id: string;
  role: AppRole;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthSeller = {
  id: string;
  name: string;
  profile_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string | null;
  is_active: boolean;
  last_login_at: string | null;
};

export type AuthContext = {
  supabase: SessionSupabaseClient;
  user: User;
  profile: AuthProfile;
  seller: AuthSeller | null;
  isDevMode: boolean;
};

function createMockDevAdminContext(client: SessionSupabaseClient): AuthContext {
  const user = {
    id: "dev-admin",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-07-23T00:00:00.000Z"
  } as User;

  const profile: AuthProfile = {
    id: user.id,
    role: "admin",
    first_name: "Mario",
    last_name: "Rossi",
    email: "admin@dev.local",
    is_active: true,
    last_login_at: "2026-07-23T09:00:00.000Z",
    created_at: "2026-07-23T00:00:00.000Z",
    updated_at: "2026-07-23T00:00:00.000Z"
  };

  return {
    supabase: client,
    user,
    profile,
    seller: null,
    isDevMode: true
  };
}

function createMockDevSellerContext(client: SessionSupabaseClient): AuthContext & { seller: AuthSeller } {
  const user = {
    id: "dev-seller",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-07-23T00:00:00.000Z"
  } as User;

  const profile: AuthProfile = {
    id: user.id,
    role: "seller",
    first_name: "Mario",
    last_name: "Rossi",
    email: "mario.rossi@dev.local",
    is_active: true,
    last_login_at: "2026-07-23T09:00:00.000Z",
    created_at: "2026-07-23T00:00:00.000Z",
    updated_at: "2026-07-23T00:00:00.000Z"
  };

  const seller: AuthSeller = {
    id: "dev-seller-001",
    name: "Mario Rossi",
    profile_id: user.id,
    first_name: "Mario",
    last_name: "Rossi",
    email: profile.email,
    status: "active",
    is_active: true,
    last_login_at: profile.last_login_at
  };

  return {
    supabase: client,
    user,
    profile,
    seller,
    isDevMode: true
  };
}

function createDevAuthContext(client: SessionSupabaseClient) {
  const role = getServerDevAuthRole();
  logDevAuth("resolved mock profile", { bypassEnabled: true, role });
  return role === "admin" ? createMockDevAdminContext(client) : createMockDevSellerContext(client);
}

async function loadProfile(supabase: SessionSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<AuthProfile>();

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Impossibile recuperare il profilo utente.");
  }

  return data ?? null;
}

async function loadSeller(supabase: SessionSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("sellers")
    .select("id,name,profile_id,first_name,last_name,email,status,is_active,last_login_at")
    .eq("profile_id", userId)
    .maybeSingle<AuthSeller>();

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Impossibile recuperare il venditore collegato.");
  }

  return data ?? null;
}

export async function requireUser(client: SessionSupabaseClient = createSupabaseServerClient()) {
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new AppError("UNAUTHENTICATED", "Autenticazione richiesta.");
  }

  return {
    supabase: client,
    user: data.user
  };
}

export async function getCurrentProfile(client: SessionSupabaseClient = createSupabaseServerClient()) {
  if (isDevAuthBypassEnabled()) {
    return createDevAuthContext(client);
  }

  const { supabase, user } = await requireUser(client);
  const profile = await loadProfile(supabase, user.id);

  if (!profile) {
    throw new AppError("PROFILE_NOT_FOUND", "Profilo utente non trovato.");
  }

  if (!profile.is_active) {
    throw new AppError("ACCOUNT_DISABLED", "Account disattivato.");
  }

  if (profile.role !== "admin" && profile.role !== "seller") {
    throw new AppError("FORBIDDEN", "Ruolo non valido.");
  }

  const seller = profile.role === "seller" ? await loadSeller(supabase, user.id) : null;

  return {
    supabase,
    user,
    profile,
    seller,
    isDevMode: false
  } satisfies AuthContext;
}

export async function requireActiveProfile(client: SessionSupabaseClient = createSupabaseServerClient()) {
  return getCurrentProfile(client);
}

export async function requireAdmin(client: SessionSupabaseClient = createSupabaseServerClient()) {
  const context = await getCurrentProfile(client);

  if (context.profile.role !== "admin") {
    logDevAuth("requireAdmin denied", {
      bypassEnabled: isDevAuthBypassEnabled(),
      resolvedRole: context.profile.role
    });
    throw new AppError("FORBIDDEN", "Questa area e riservata agli amministratori.");
  }

  return context;
}

export async function requireSeller(client: SessionSupabaseClient = createSupabaseServerClient()) {
  const context = await requireActiveProfile(client);

  if (context.profile.role !== "seller") {
    throw new AppError("FORBIDDEN", "Questa area e riservata ai venditori.");
  }

  if (!context.seller) {
    throw new AppError("SELLER_NOT_LINKED", "Nessun record venditore collegato al profilo.");
  }

  if (!context.seller.is_active || context.seller.status === "disabled" || context.seller.status === "suspended") {
    throw new AppError("ACCOUNT_DISABLED", "Account venditore disattivato.");
  }

  return context as AuthContext & { seller: AuthSeller };
}

export async function getCurrentSeller(client: SessionSupabaseClient = createSupabaseServerClient()) {
  const context = await requireSeller(client);
  return context.seller;
}

export function getViewerDisplayName(profile: AuthProfile, seller?: AuthSeller | null) {
  const firstName = seller?.first_name ?? profile.first_name;
  const lastName = seller?.last_name ?? profile.last_name;
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return fullName || seller?.name || profile.email || "Utente";
}
