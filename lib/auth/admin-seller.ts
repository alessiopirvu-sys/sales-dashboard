import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { insertSellerAuditLog } from "@/lib/auth/audit";
import { AppError } from "@/lib/auth/errors";
import {
  buildCompletedPasswordMetadata,
  isPasswordChangeRequired,
  buildTemporaryPasswordMetadata
} from "@/lib/auth/password-policy";
import { buildSellerAccountPlan, sellerPlatformAccessSchema } from "@/lib/sellers/access";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const inviteSellerSchema = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    email: z.string().trim().email()
  })
  .strict();

export const sellerStatusSchema = z
  .object({
    isActive: z.boolean()
  })
  .strict();

export type InviteSellerPayload = z.infer<typeof inviteSellerSchema>;
export type ToggleSellerStatusPayload = z.infer<typeof sellerStatusSchema>;

type SellerAccessRow = {
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

type SellerCoreSnapshot = Pick<SellerAccessRow, "id" | "name"> & {
  sheet_url?: string | null;
  sheets?: Record<string, string> | null;
};

function getSellerNameParts(name: string, seller: Pick<SellerAccessRow, "first_name" | "last_name">) {
  const trimmedName = name.trim();
  const parts = trimmedName.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: seller.first_name ?? "",
      lastName: seller.last_name ?? ""
    };
  }

  return {
    firstName: parts[0] ?? seller.first_name ?? "",
    lastName: parts.slice(1).join(" ") || seller.last_name || ""
  };
}

async function getAuthUserById(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Impossibile verificare l'utente Auth collegato.");
  }

  return data.user;
}

async function insertSellerAuditLogSafe(
  input: Parameters<typeof insertSellerAuditLog>[0]
) {
  try {
    await insertSellerAuditLog(input);
  } catch (error) {
    console.error("Audit venditore non registrato", error);
  }
}

async function listAllAuthUsersByEmail(email: string) {
  const supabase = getSupabaseAdmin();
  const perPage = 200;
  let page = 1;

  while (true) {
    const response = await supabase.auth.admin.listUsers({ page, perPage });

    if (response.error) {
      throw new AppError("INTERNAL_ERROR", "Impossibile leggere gli utenti Auth.");
    }

    const match = response.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) {
      return match;
    }

    if (response.data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function getSellerForAdmin(sellerId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sellers")
    .select("id,name,profile_id,first_name,last_name,email,status,is_active,last_login_at")
    .eq("id", sellerId)
    .maybeSingle<SellerAccessRow>();

  if (error) {
    throw new AppError("INTERNAL_ERROR", error.message);
  }

  if (!data) {
    throw new AppError("FORBIDDEN", "Venditore non trovato.", 404);
  }

  return data;
}

async function findProfileByEmail(email: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Impossibile verificare il profilo esistente.");
  }

  return data;
}

async function findProfileById(profileId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Impossibile verificare il profilo collegato.");
  }

  return data;
}

async function ensureProfileIdNotUsedByAnotherSeller(profileId: string, sellerId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sellers")
    .select("id")
    .eq("profile_id", profileId)
    .neq("id", sellerId)
    .maybeSingle();

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Impossibile verificare le associazioni seller.");
  }

  if (data) {
    throw new AppError("CONFLICT", "Questo account Auth e gia collegato a un altro venditore.");
  }
}

async function rollbackSellerSnapshot(snapshot: SellerAccessRow) {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("sellers")
    .update({
      profile_id: snapshot.profile_id,
      first_name: snapshot.first_name,
      last_name: snapshot.last_name,
      email: snapshot.email,
      status: snapshot.status,
      is_active: snapshot.is_active,
      last_login_at: snapshot.last_login_at
    })
    .eq("id", snapshot.id);
}

export async function rollbackSellerCoreSnapshot(snapshot: SellerCoreSnapshot) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("sellers")
    .update({
      name: snapshot.name,
      sheet_url: snapshot.sheet_url ?? "",
      sheets: snapshot.sheets ?? {}
    })
    .eq("id", snapshot.id);

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Ripristino dati venditore non riuscito.");
  }
}

async function ensureEmailAvailableForSeller(email: string, sellerId: string, profileId?: string | null) {
  const existingProfile = await findProfileByEmail(email);
  if (existingProfile && existingProfile.id !== profileId) {
    throw new AppError("CONFLICT", "L'email e gia collegata a un altro profilo.");
  }

  const existingAuthUser = await listAllAuthUsersByEmail(email);
  if (existingAuthUser && existingAuthUser.id !== profileId) {
    await ensureProfileIdNotUsedByAnotherSeller(existingAuthUser.id, sellerId);
    throw new AppError("CONFLICT", "Questa email e gia utilizzata da un altro account.");
  }
}

export async function syncSellerPlatformAccess(
  sellerId: string,
  actorProfileId: string,
  sellerName: string,
  rawPayload: unknown
) {
  const parsedAccess = sellerPlatformAccessSchema.safeParse(rawPayload ?? {});
  if (!parsedAccess.success) {
    throw new AppError("VALIDATION_ERROR", parsedAccess.error.issues[0]?.message ?? "Dati accesso non validi.");
  }

  const supabase = getSupabaseAdmin();
  const seller = await getSellerForAdmin(sellerId);
  let plan;

  try {
    plan = buildSellerAccountPlan(parsedAccess.data, {
      hasLinkedAccount: Boolean(seller.profile_id),
      currentEmail: seller.email,
      currentIsActive: seller.is_active
    });
  } catch (error) {
    throw new AppError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Dati accesso non validi."
    );
  }

  if (plan.kind === "none") {
    return {
      sellerId,
      accessConfigured: Boolean(seller.profile_id),
      status: seller.profile_id ? (seller.is_active ? "active" : "disabled") : "none"
    };
  }

  const sellerSnapshot = { ...seller };
  const nameParts = getSellerNameParts(sellerName, seller);
  const nextSellerStatus = plan.nextIsActive ? "active" : "disabled";
  let createdAuthUserId: string | null = null;

  try {
    if (plan.kind === "create") {
      await ensureEmailAvailableForSeller(plan.email, sellerId, null);

      const createdUser = await supabase.auth.admin.createUser({
        email: plan.email,
        password: plan.password,
        email_confirm: true,
        user_metadata: buildTemporaryPasswordMetadata({
          firstName: nameParts.firstName,
          lastName: nameParts.lastName
        })
      });

      if (createdUser.error || !createdUser.data.user) {
        throw new AppError(
          "INTERNAL_ERROR",
          createdUser.error?.message || "Creazione account venditore non riuscita."
        );
      }

      createdAuthUserId = createdUser.data.user.id;

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: createdAuthUserId,
          role: "seller",
          first_name: nameParts.firstName,
          last_name: nameParts.lastName,
          email: plan.email,
          is_active: plan.nextIsActive
        },
        { onConflict: "id" }
      );

      if (profileError) {
        throw new AppError("INTERNAL_ERROR", `Salvataggio profilo seller non riuscito: ${profileError.message}`);
      }

      const { error: sellerError } = await supabase
        .from("sellers")
        .update({
          profile_id: createdAuthUserId,
          first_name: nameParts.firstName,
          last_name: nameParts.lastName,
          email: plan.email,
          is_active: plan.nextIsActive,
          status: nextSellerStatus
        })
        .eq("id", sellerId);

      if (sellerError) {
        throw new AppError("INTERNAL_ERROR", `Collegamento account venditore non riuscito: ${sellerError.message}`);
      }

      await insertSellerAuditLogSafe({
        actorProfileId,
        sellerId,
        action: "seller_account_created",
        metadata: {
          email: plan.email,
          authUserId: createdAuthUserId
        }
      });

      return {
        sellerId,
        accessConfigured: true,
        created: true,
        status: nextSellerStatus
      };
    }

    const profileId = seller.profile_id;
    if (!profileId) {
      throw new AppError("CONFLICT", "Il venditore non ha un account collegato.");
    }

    await ensureEmailAvailableForSeller(plan.email, sellerId, profileId);
    const authUser = await getAuthUserById(profileId);
    await findProfileById(profileId);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: nameParts.firstName,
        last_name: nameParts.lastName,
        email: plan.email,
        is_active: plan.nextIsActive
      })
      .eq("id", profileId);

    if (profileError) {
      throw new AppError("INTERNAL_ERROR", `Aggiornamento profilo seller non riuscito: ${profileError.message}`);
    }

    const { error: sellerError } = await supabase
      .from("sellers")
      .update({
        first_name: nameParts.firstName,
        last_name: nameParts.lastName,
        email: plan.email,
        is_active: plan.nextIsActive,
        status: nextSellerStatus
      })
      .eq("id", sellerId);

    if (sellerError) {
      throw new AppError("INTERNAL_ERROR", `Aggiornamento account venditore non riuscito: ${sellerError.message}`);
    }

    const authUpdate: {
      email?: string;
      password?: string;
      user_metadata?: Record<string, unknown>;
    } = {
      user_metadata: isPasswordChangeRequired(authUser.user_metadata)
        ? buildTemporaryPasswordMetadata({
            firstName: nameParts.firstName,
            lastName: nameParts.lastName
          })
        : buildCompletedPasswordMetadata({
            firstName: nameParts.firstName,
            lastName: nameParts.lastName
          })
    };

    if (plan.emailChanged) {
      authUpdate.email = plan.email;
    }

    if (plan.passwordChanged && plan.password) {
      authUpdate.password = plan.password;
      authUpdate.user_metadata = buildTemporaryPasswordMetadata({
        firstName: nameParts.firstName,
        lastName: nameParts.lastName
      });
    }

    const authResult = await supabase.auth.admin.updateUserById(profileId, authUpdate);
    if (authResult.error) {
      await rollbackSellerSnapshot(sellerSnapshot);
      throw new AppError(
        "INTERNAL_ERROR",
        `Aggiornamento credenziali venditore non riuscito: ${authResult.error.message}`
      );
    }

    await insertSellerAuditLogSafe({
      actorProfileId,
      sellerId,
      action: "seller_account_updated",
      metadata: {
        emailChanged: plan.emailChanged,
        passwordChanged: plan.passwordChanged,
        statusChanged: plan.statusChanged,
        nextStatus: nextSellerStatus,
        email: plan.email
      }
    });

    return {
      sellerId,
      accessConfigured: true,
      updated: true,
      status: nextSellerStatus
    };
  } catch (error) {
    console.error("[syncSellerPlatformAccess] rollback", {
      sellerId,
      message: error instanceof Error ? error.message : "unknown"
    });
    await rollbackSellerSnapshot(sellerSnapshot);

    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
      await supabase.from("profiles").delete().eq("id", createdAuthUserId);
    }

    throw error;
  }
}

export async function inviteSellerAccount(
  sellerId: string,
  actorProfileId: string,
  origin: string,
  rawPayload: unknown
) {
  const payload = inviteSellerSchema.safeParse(rawPayload);
  if (!payload.success) {
    throw new AppError("VALIDATION_ERROR", "Dati invito non validi.");
  }

  const supabase = getSupabaseAdmin();
  const seller = await getSellerForAdmin(sellerId);

  if (seller.profile_id) {
    throw new AppError("CONFLICT", "Il venditore ha gia un account collegato.");
  }

  const email = payload.data.email.toLowerCase();
  const existingProfile = await findProfileByEmail(email);
  if (existingProfile && existingProfile.id !== seller.profile_id) {
    throw new AppError("CONFLICT", "L'email e gia collegata a un altro profilo.");
  }

  const existingAuthUser = await listAllAuthUsersByEmail(email);
  if (existingAuthUser) {
    await ensureProfileIdNotUsedByAnotherSeller(existingAuthUser.id, sellerId);
  }

  const snapshot = { ...seller };
  let createdAuthUserId: string | null = null;
  const redirectTo = `${origin}/auth/callback?next=/update-password`;

  try {
    let authUserId = existingAuthUser?.id ?? null;

    if (!authUserId) {
      const inviteResult = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          first_name: payload.data.firstName,
          last_name: payload.data.lastName
        }
      });

      if (inviteResult.error || !inviteResult.data.user) {
        throw new AppError("INTERNAL_ERROR", "Invio invito non riuscito.");
      }

      authUserId = inviteResult.data.user.id;
      createdAuthUserId = authUserId;
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: authUserId,
        role: "seller",
        first_name: payload.data.firstName,
        last_name: payload.data.lastName,
        email,
        is_active: true
      },
      {
        onConflict: "id"
      }
    );

    if (profileError) {
      throw new AppError("INTERNAL_ERROR", "Salvataggio profilo seller non riuscito.");
    }

    const { error: sellerError } = await supabase
      .from("sellers")
      .update({
        profile_id: authUserId,
        first_name: payload.data.firstName,
        last_name: payload.data.lastName,
        email,
        is_active: true,
        status: existingAuthUser ? "active" : "pending_invite"
      })
      .eq("id", sellerId);

    if (sellerError) {
      throw new AppError("INTERNAL_ERROR", "Collegamento account venditore non riuscito.");
    }

    if (existingAuthUser) {
      await sendRecoveryEmail(email, origin);
    }

    await insertSellerAuditLog({
      actorProfileId,
      sellerId,
      action: existingAuthUser ? "seller_account_linked" : "seller_invited",
      metadata: {
        email,
        firstName: payload.data.firstName,
        lastName: payload.data.lastName,
        authUserId
      }
    });

    return {
      sellerId,
      email,
      linked: true,
      invited: true
    };
  } catch (error) {
    await rollbackSellerSnapshot(snapshot);

    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
      await supabase.from("profiles").delete().eq("id", createdAuthUserId);
    }

    throw error;
  }
}

async function sendRecoveryEmail(email: string, origin: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/update-password`
  });

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Impossibile inviare l'email di reset password.");
  }
}

export async function sendSellerResetPassword(
  sellerId: string,
  actorProfileId: string,
  origin: string
) {
  const seller = await getSellerForAdmin(sellerId);
  if (!seller.email || !seller.profile_id) {
    throw new AppError("CONFLICT", "Il venditore non ha un account collegato.");
  }

  await sendRecoveryEmail(seller.email, origin);

  await insertSellerAuditLog({
    actorProfileId,
    sellerId,
    action: "seller_password_reset_sent",
    metadata: {
      email: seller.email
    }
  });

  return {
    success: true
  };
}

export async function toggleSellerAccountStatus(
  sellerId: string,
  actorProfileId: string,
  rawPayload: unknown
) {
  const payload = sellerStatusSchema.safeParse(rawPayload);
  if (!payload.success) {
    throw new AppError("VALIDATION_ERROR", "Stato account non valido.");
  }

  const supabase = getSupabaseAdmin();
  const seller = await getSellerForAdmin(sellerId);
  const nextIsActive = payload.data.isActive;
  const nextStatus = nextIsActive ? "active" : "disabled";

  if (seller.profile_id) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_active: nextIsActive
      })
      .eq("id", seller.profile_id);

    if (profileError) {
      throw new AppError("INTERNAL_ERROR", "Aggiornamento profilo non riuscito.");
    }
  }

  const { error: sellerError } = await supabase
    .from("sellers")
    .update({
      is_active: nextIsActive,
      status: nextStatus
    })
    .eq("id", sellerId);

  if (sellerError) {
    throw new AppError("INTERNAL_ERROR", "Aggiornamento venditore non riuscito.");
  }

  await insertSellerAuditLog({
    actorProfileId,
    sellerId,
    action: nextIsActive ? "seller_reactivated" : "seller_deactivated",
    metadata: {
      previousStatus: seller.status,
      nextStatus
    }
  });

  return {
    sellerId,
    isActive: nextIsActive
  };
}

export async function unlinkSellerProfile(sellerId: string, actorProfileId: string) {
  const supabase = getSupabaseAdmin();
  const seller = await getSellerForAdmin(sellerId);

  if (!seller.profile_id) {
    return { sellerId, unlinked: false };
  }

  const previousProfileId = seller.profile_id;

  const { error } = await supabase
    .from("sellers")
    .update({
      profile_id: null,
      status: "disabled",
      is_active: false
    })
    .eq("id", sellerId);

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Scollegamento account non riuscito.");
  }

  await insertSellerAuditLog({
    actorProfileId,
    sellerId,
    action: "seller_account_unlinked",
    metadata: {
      previousProfileId
    }
  });

  return {
    sellerId,
    unlinked: true
  };
}

export async function trackSuccessfulLogin(userId: string) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  await Promise.allSettled([
    supabase.from("profiles").update({ last_login_at: now }).eq("id", userId),
    supabase
      .from("sellers")
      .update({ last_login_at: now, status: "active", is_active: true })
      .eq("profile_id", userId)
  ]);
}
