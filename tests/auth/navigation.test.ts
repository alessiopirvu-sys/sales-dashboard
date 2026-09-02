import { describe, expect, it } from "vitest";

import {
  ADMIN_HOME_PATH,
  SELLER_HOME_PATH,
  getSidebarItems,
  isAdminPagePath,
  isSellerPagePath,
  resolvePostLoginPath,
  sanitizeRedirectPath
} from "../../lib/auth/navigation";

describe("auth navigation helpers", () => {
  it("sanitizza redirect esterni o non validi", () => {
    expect(sanitizeRedirectPath("https://evil.test", ADMIN_HOME_PATH)).toBe(ADMIN_HOME_PATH);
    expect(sanitizeRedirectPath("//evil.test", ADMIN_HOME_PATH)).toBe(ADMIN_HOME_PATH);
    expect(sanitizeRedirectPath("dashboard", ADMIN_HOME_PATH)).toBe(ADMIN_HOME_PATH);
    expect(sanitizeRedirectPath("/auth/post-login", ADMIN_HOME_PATH)).toBe(ADMIN_HOME_PATH);
  });

  it("mantiene redirect interni validi", () => {
    expect(sanitizeRedirectPath("/venditori", ADMIN_HOME_PATH)).toBe("/venditori");
    expect(sanitizeRedirectPath("/area-venditore/kpi", SELLER_HOME_PATH)).toBe("/area-venditore/kpi");
  });

  it("reindirizza il seller fuori dalle route admin", () => {
    expect(resolvePostLoginPath("seller", "/dashboard")).toBe(SELLER_HOME_PATH);
    expect(resolvePostLoginPath("seller", "/venditori")).toBe(SELLER_HOME_PATH);
  });

  it("reindirizza l'admin fuori dalle route seller", () => {
    expect(resolvePostLoginPath("admin", "/area-venditore")).toBe(ADMIN_HOME_PATH);
    expect(resolvePostLoginPath("admin", "/area-venditore/kpi")).toBe(ADMIN_HOME_PATH);
  });

  it("genera sidebar diverse per admin e seller", () => {
    expect(getSidebarItems("admin").map((item) => item.label)).toEqual([
      "Home",
      "Dashboard",
      "Venditori",
      "Esportazioni",
      "Team Sales"
    ]);

    expect(getSidebarItems("seller").map((item) => item.label)).toEqual([
      "Area venditore",
      "KPI",
      "Team Sales"
    ]);
  });

  it("riconosce correttamente route admin e seller", () => {
    expect(isAdminPagePath("/dashboard")).toBe(true);
    expect(isAdminPagePath("/area-venditore")).toBe(false);
    expect(isSellerPagePath("/area-venditore/kpi")).toBe(true);
    expect(isSellerPagePath("/venditori")).toBe(false);
  });
});
