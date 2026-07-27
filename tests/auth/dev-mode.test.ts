import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: () => undefined
  })
}));

describe("dev auth mode helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("abilita il bypass solo in development con flag pubblico attivo", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_DEV_AUTH_BYPASS", "true");

    const { isDevAuthBypassEnabled } = await import("../../lib/auth/dev-mode");
    expect(isDevAuthBypassEnabled()).toBe(true);
  });

  it("ignora il bypass in produzione", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEV_AUTH_BYPASS", "true");

    const { isDevAuthBypassEnabled } = await import("../../lib/auth/dev-mode");
    expect(isDevAuthBypassEnabled()).toBe(false);
  });

  it("usa il cookie ruolo solo quando valido e altrimenti ricade su DEV_AUTH_ROLE", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_DEV_AUTH_BYPASS", "true");
    vi.stubEnv("DEV_AUTH_ROLE", "admin");

    const { getEffectiveDevAuthRole } = await import("../../lib/auth/dev-mode");

    expect(getEffectiveDevAuthRole("seller")).toBe("seller");
    expect(getEffectiveDevAuthRole("invalid")).toBe("admin");
  });
});
