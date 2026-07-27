import { describe, expect, it } from "vitest";

import {
  buildSellerAccountPlan,
  isStrongTemporaryPassword,
  sellerPlatformAccessSchema,
  sellerUpsertRequestSchema
} from "../../lib/sellers/access";

describe("seller access validation", () => {
  it("consente la creazione venditore senza account", () => {
    const result = sellerUpsertRequestSchema.safeParse({
      name: "Mario Rossi",
      access: {
        email: "",
        password: "",
        confirmPassword: "",
        accountStatus: "none"
      }
    });

    expect(result.success).toBe(true);

    const plan = buildSellerAccountPlan(result.success ? result.data.access : null, {
      hasLinkedAccount: false
    });

    expect(plan.kind).toBe("none");
  });

  it("pianifica la creazione account quando email e password sono presenti", () => {
    const parsed = sellerPlatformAccessSchema.parse({
      email: "SELLER@example.com ",
      password: "Password1",
      confirmPassword: "Password1",
      accountStatus: "active"
    });

    const plan = buildSellerAccountPlan(parsed, {
      hasLinkedAccount: false
    });

    expect(plan).toMatchObject({
      kind: "create",
      email: "seller@example.com",
      nextIsActive: true
    });
  });

  it("rifiuta password deboli", () => {
    const result = sellerPlatformAccessSchema.safeParse({
      email: "seller@example.com",
      password: "abc",
      confirmPassword: "abc",
      accountStatus: "active"
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("almeno 8 caratteri");
  });

  it("rifiuta conferma password diversa", () => {
    const result = sellerPlatformAccessSchema.safeParse({
      email: "seller@example.com",
      password: "Password1",
      confirmPassword: "Password2",
      accountStatus: "active"
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("non coincidono");
  });

  it("pianifica l'aggiornamento email e password per un account esistente senza restituire la conferma password", () => {
    const plan = buildSellerAccountPlan(
      {
        email: "nuova.email@example.com",
        password: "NuovaPass1",
        confirmPassword: "NuovaPass1",
        accountStatus: "disabled"
      },
      {
        hasLinkedAccount: true,
        currentEmail: "vecchia.email@example.com",
        currentIsActive: true
      }
    );

    expect(plan).toMatchObject({
      kind: "update",
      email: "nuova.email@example.com",
      password: "NuovaPass1",
      nextIsActive: false,
      emailChanged: true,
      passwordChanged: true,
      statusChanged: true
    });
    expect("confirmPassword" in plan).toBe(false);
  });

  it("segnala email mancante quando si collega un account a un venditore esistente", () => {
    expect(() =>
      buildSellerAccountPlan(
        {
          email: "",
          password: "Password1",
          confirmPassword: "Password1",
          accountStatus: "active"
        },
        {
          hasLinkedAccount: false
        }
      )
    ).toThrow("Inserisci l'email di accesso.");
  });

  it("riconosce correttamente una password temporanea valida", () => {
    expect(isStrongTemporaryPassword("Password1")).toBe(true);
    expect(isStrongTemporaryPassword("password")).toBe(false);
  });
});
