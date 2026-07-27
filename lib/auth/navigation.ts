import { AppRole } from "@/lib/internal-kpi/types";

export const ADMIN_HOME_PATH = "/dashboard";
export const SELLER_HOME_PATH = "/area-venditore";
export const UPDATE_PASSWORD_PATH = "/update-password";

export const PUBLIC_AUTH_PREFIXES = [
  "/login",
  "/reset-password",
  "/update-password",
  "/auth/callback",
  "/auth/post-login",
  "/auth/error",
  "/auth/exit"
];

export const PUBLIC_AUTH_API_PREFIXES = ["/api/auth/session", "/api/auth/reset-password"];

export const ADMIN_ROUTE_PREFIXES = [
  "/",
  "/home",
  "/dashboard",
  "/venditori",
  "/esportazioni"
];

export const ADMIN_API_PREFIXES = [
  "/api/assistant",
  "/api/dashboard",
  "/api/dashboard-data",
  "/api/sellers",
  "/api/sheets",
  "/api/admin"
];

export const SELLER_ROUTE_PREFIXES = ["/area-venditore"];
export const SELLER_API_PREFIXES = ["/api/seller"];

export type SidebarItem = {
  href: string;
  label: string;
  icon: "home" | "dashboard" | "users" | "download";
};

export function isPublicAuthPath(pathname: string) {
  return PUBLIC_AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isPublicAuthApiPath(pathname: string) {
  return PUBLIC_AUTH_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isAdminPagePath(pathname: string) {
  return ADMIN_ROUTE_PREFIXES.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isAdminApiPath(pathname: string) {
  return ADMIN_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isSellerPagePath(pathname: string) {
  return SELLER_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isSellerApiPath(pathname: string) {
  return SELLER_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function sanitizeRedirectPath(candidate: string | null | undefined, fallback: string) {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  if (candidate.startsWith("/login") || candidate.startsWith("/auth/")) {
    return fallback;
  }

  return candidate;
}

export function resolveRoleHome(role: AppRole) {
  return role === "admin" ? ADMIN_HOME_PATH : SELLER_HOME_PATH;
}

export function resolvePostLoginPath(role: AppRole, nextPath: string | null | undefined) {
  const fallback = resolveRoleHome(role);
  const safePath = sanitizeRedirectPath(nextPath, fallback);

  if (role === "admin" && isSellerPagePath(safePath)) {
    return ADMIN_HOME_PATH;
  }

  if (role === "seller" && (isAdminPagePath(safePath) || isAdminApiPath(safePath))) {
    return SELLER_HOME_PATH;
  }

  return safePath;
}

export function getSidebarItems(role: AppRole): SidebarItem[] {
  if (role === "seller") {
    return [
      { href: "/area-venditore", label: "Area venditore", icon: "home" },
      { href: "/area-venditore/kpi", label: "KPI", icon: "dashboard" }
    ];
  }

  return [
    { href: "/home", label: "Home", icon: "home" },
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/venditori", label: "Venditori", icon: "users" },
    { href: "/esportazioni", label: "Esportazioni", icon: "download" }
  ];
}

export function getAuthErrorContent(code: string | null | undefined) {
  switch (code) {
    case "ACCOUNT_DISABLED":
      return {
        title: "Accesso non disponibile",
        description: "Il tuo account e disattivato. Contatta l'amministratore."
      };
    case "PROFILE_NOT_FOUND":
      return {
        title: "Profilo non configurato",
        description: "L'account esiste ma non ha ancora un profilo valido in piattaforma."
      };
    case "SELLER_NOT_LINKED":
      return {
        title: "Venditore non collegato",
        description: "Il profilo seller non e collegato a un record venditore."
      };
    case "FORBIDDEN":
      return {
        title: "Accesso negato",
        description: "Non hai i permessi necessari per visualizzare questa sezione."
      };
    case "UNAUTHENTICATED":
      return {
        title: "Sessione non valida",
        description: "La sessione di accesso non e stata completata correttamente. Riprova ad accedere."
      };
    default:
      return {
        title: "Accesso non completato",
        description: "Non e stato possibile completare l'autenticazione."
      };
  }
}
