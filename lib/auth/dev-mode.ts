import { cookies } from "next/headers";

import { AppRole } from "@/lib/internal-kpi/types";

export const DEV_AUTH_ROLE_COOKIE = "dev-auth-role";

export function isDevAuthBypassEnabled() {
  return process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
}

export function isAllowedDevRole(role: string | null | undefined): role is AppRole {
  return role === "admin" || role === "seller";
}

export function getDefaultDevAuthRole(): AppRole {
  const configuredRole = process.env.DEV_AUTH_ROLE;
  return isAllowedDevRole(configuredRole) ? configuredRole : "admin";
}

export function getEffectiveDevAuthRole(cookieRole?: string | null): AppRole {
  if (!isDevAuthBypassEnabled()) {
    return getDefaultDevAuthRole();
  }

  if (isAllowedDevRole(cookieRole)) {
    return cookieRole;
  }

  return getDefaultDevAuthRole();
}

export function getServerDevAuthRole() {
  if (!isDevAuthBypassEnabled()) {
    return getDefaultDevAuthRole();
  }

  const cookieStore = cookies();
  return getEffectiveDevAuthRole(cookieStore.get(DEV_AUTH_ROLE_COOKIE)?.value);
}

export function isDevBypassLoginPath(pathname: string) {
  return pathname === "/login";
}

export function isSellerDevBypassPath(pathname: string) {
  return pathname === "/area-venditore" || pathname.startsWith("/area-venditore/");
}

export function isAdminDevBypassPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/home" ||
    pathname.startsWith("/home/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/venditori" ||
    pathname.startsWith("/venditori/") ||
    pathname === "/esportazioni" ||
    pathname.startsWith("/esportazioni/")
  );
}

export function isDevRoleSwitchApiPath(pathname: string) {
  return pathname === "/api/auth/dev-role";
}
