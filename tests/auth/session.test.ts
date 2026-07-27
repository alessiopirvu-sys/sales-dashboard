import { describe, expect, it } from "vitest";

import { AppError } from "../../lib/auth/errors";
import { requireActiveProfile, requireAdmin, requireSeller } from "../../lib/auth/session";

type MockRowResult = {
  data: unknown;
  error: unknown;
};

type MockClientOptions = {
  user?: { id: string } | null;
  authError?: unknown;
  profiles?: Record<string, MockRowResult>;
  sellers?: Record<string, MockRowResult>;
};

function createMockClient(options: MockClientOptions = {}) {
  return {
    auth: {
      async getUser() {
        return {
          data: {
            user: options.user ?? null
          },
          error: options.authError ?? null
        };
      }
    },
    from(table: string) {
      return {
        select() {
          return this;
        },
        eq(column: string, value: string) {
          const bucket = table === "profiles" ? options.profiles : options.sellers;
          const key = `${column}:${value}`;
          const result = bucket?.[key] ?? { data: null, error: null };

          return {
            async maybeSingle() {
              return result;
            }
          };
        }
      };
    }
  };
}

describe("auth session helpers", () => {
  it("requireAdmin accetta un admin attivo", async () => {
    const client = createMockClient({
      user: { id: "user-admin" },
      profiles: {
        "id:user-admin": {
          data: {
            id: "user-admin",
            role: "admin",
            first_name: "Ada",
            last_name: "Admin",
            email: "ada@example.com",
            is_active: true,
            last_login_at: null,
            created_at: "2026-07-01T00:00:00.000Z",
            updated_at: "2026-07-01T00:00:00.000Z"
          },
          error: null
        }
      }
    });

    const context = await requireAdmin(client as never);
    expect(context.profile.role).toBe("admin");
  });

  it("requireActiveProfile blocca un account disattivato", async () => {
    const client = createMockClient({
      user: { id: "user-disabled" },
      profiles: {
        "id:user-disabled": {
          data: {
            id: "user-disabled",
            role: "seller",
            first_name: "Sara",
            last_name: "Seller",
            email: "sara@example.com",
            is_active: false,
            last_login_at: null,
            created_at: "2026-07-01T00:00:00.000Z",
            updated_at: "2026-07-01T00:00:00.000Z"
          },
          error: null
        }
      }
    });

    await expect(requireActiveProfile(client as never)).rejects.toMatchObject({
      code: "ACCOUNT_DISABLED"
    });
  });

  it("requireActiveProfile fallisce se il profilo non esiste", async () => {
    const client = createMockClient({
      user: { id: "missing-profile" }
    });

    await expect(requireActiveProfile(client as never)).rejects.toMatchObject({
      code: "PROFILE_NOT_FOUND"
    });
  });

  it("requireSeller fallisce se il seller non e collegato", async () => {
    const client = createMockClient({
      user: { id: "seller-no-link" },
      profiles: {
        "id:seller-no-link": {
          data: {
            id: "seller-no-link",
            role: "seller",
            first_name: "Luca",
            last_name: "Linked",
            email: "luca@example.com",
            is_active: true,
            last_login_at: null,
            created_at: "2026-07-01T00:00:00.000Z",
            updated_at: "2026-07-01T00:00:00.000Z"
          },
          error: null
        }
      }
    });

    await expect(requireSeller(client as never)).rejects.toMatchObject({
      code: "SELLER_NOT_LINKED"
    });
  });

  it("requireSeller blocca un seller disattivato o sospeso", async () => {
    const client = createMockClient({
      user: { id: "seller-suspended" },
      profiles: {
        "id:seller-suspended": {
          data: {
            id: "seller-suspended",
            role: "seller",
            first_name: "Marta",
            last_name: "Suspended",
            email: "marta@example.com",
            is_active: true,
            last_login_at: null,
            created_at: "2026-07-01T00:00:00.000Z",
            updated_at: "2026-07-01T00:00:00.000Z"
          },
          error: null
        }
      },
      sellers: {
        "profile_id:seller-suspended": {
          data: {
            id: "seller-1",
            name: "Marta",
            profile_id: "seller-suspended",
            first_name: "Marta",
            last_name: "Suspended",
            email: "marta@example.com",
            status: "suspended",
            is_active: true,
            last_login_at: null
          },
          error: null
        }
      }
    });

    await expect(requireSeller(client as never)).rejects.toMatchObject({
      code: "ACCOUNT_DISABLED"
    });
  });

  it("requireSeller restituisce il contesto seller valido", async () => {
    const client = createMockClient({
      user: { id: "seller-ok" },
      profiles: {
        "id:seller-ok": {
          data: {
            id: "seller-ok",
            role: "seller",
            first_name: "Giulia",
            last_name: "Rossi",
            email: "giulia@example.com",
            is_active: true,
            last_login_at: null,
            created_at: "2026-07-01T00:00:00.000Z",
            updated_at: "2026-07-01T00:00:00.000Z"
          },
          error: null
        }
      },
      sellers: {
        "profile_id:seller-ok": {
          data: {
            id: "seller-2",
            name: "Giulia Rossi",
            profile_id: "seller-ok",
            first_name: "Giulia",
            last_name: "Rossi",
            email: "giulia@example.com",
            status: "active",
            is_active: true,
            last_login_at: null
          },
          error: null
        }
      }
    });

    const context = await requireSeller(client as never);
    expect(context.seller.id).toBe("seller-2");
    expect(context.profile.role).toBe("seller");
  });
});
