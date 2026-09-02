import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import {
  ADMIN_HOME_PATH,
  SELLER_HOME_PATH,
  isAdminApiPath,
  isAdminPagePath,
  isPublicAuthApiPath,
  isPublicAuthPath,
  isSellerApiPath,
  isSellerPagePath,
  resolveRoleHome
} from "@/lib/auth/navigation";
import {
  FORCE_PASSWORD_UPDATE_PATH,
  isPasswordChangeRequired
} from "@/lib/auth/password-policy";
import {
  getEffectiveDevAuthRole,
  isAdminDevBypassPath,
  isDevAuthBypassEnabled,
  isDevBypassLoginPath,
  isDevRoleSwitchApiPath,
  isDualRoleDevBypassPath,
  isSellerDevBypassPath
} from "@/lib/auth/dev-mode";

function buildMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );
}

function jsonAuthError(status: number, error: string, message: string) {
  return NextResponse.json({ error, message }, { status });
}

function isAllowedDuringForcedPasswordUpdate(pathname: string) {
  return (
    pathname === FORCE_PASSWORD_UPDATE_PATH ||
    pathname.startsWith("/auth/") ||
    pathname === "/api/auth/session" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/auth/reset-password"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Asset statici pubblici (es. suoni della schermata TV): niente da
  // proteggere, non servono controlli di autenticazione.
  if (pathname.startsWith("/sounds/")) {
    return NextResponse.next();
  }

  const isApiRequest = pathname.startsWith("/api/");
  const devBypassEnabled = isDevAuthBypassEnabled();
  const isPostLoginPath = pathname === "/auth/post-login";

  if (devBypassEnabled) {
    const devRole = getEffectiveDevAuthRole(request.cookies.get("dev-auth-role")?.value);
    const devHome = resolveRoleHome(devRole);

    if (isDevBypassLoginPath(pathname)) {
      return NextResponse.redirect(new URL(devRole === "admin" ? ADMIN_HOME_PATH : "/area-venditore/kpi", request.url));
    }

    if (isDevRoleSwitchApiPath(pathname)) {
      return NextResponse.next();
    }

    if (isDualRoleDevBypassPath(pathname)) {
      return NextResponse.next();
    }

    if (devRole === "seller") {
      if (isApiRequest && isAdminApiPath(pathname)) {
        return jsonAuthError(403, "FORBIDDEN", "La modalita DEV corrente non e admin.");
      }

      if (isApiRequest && isSellerApiPath(pathname)) {
        return NextResponse.next();
      }

      if (isSellerDevBypassPath(pathname)) {
        return NextResponse.next();
      }

      if (isAdminPagePath(pathname)) {
        return NextResponse.redirect(new URL(SELLER_HOME_PATH, request.url));
      }
    }

    if (devRole === "admin") {
      if (isApiRequest && isAdminApiPath(pathname)) {
        return NextResponse.next();
      }

      if (isApiRequest && isSellerApiPath(pathname)) {
        return jsonAuthError(403, "FORBIDDEN", "Accesso negato.");
      }

      if (isAdminDevBypassPath(pathname)) {
        return NextResponse.next();
      }

      if (isSellerDevBypassPath(pathname)) {
        return NextResponse.redirect(new URL(ADMIN_HOME_PATH, request.url));
      }
    }
  }

  const response = NextResponse.next();
  const supabase = buildMiddlewareClient(request, response);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    if (isApiRequest && isPublicAuthApiPath(pathname)) {
      return response;
    }

    if (isPublicAuthPath(pathname)) {
      return response;
    }

    if (isApiRequest) {
      return jsonAuthError(401, "UNAUTHENTICATED", "Autenticazione richiesta.");
    }

    const loginUrl = new URL("/login", request.url);
    if (!pathname.startsWith("/_next") && pathname !== "/favicon.ico") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .maybeSingle<{ id: string; role: "admin" | "seller"; is_active: boolean }>();

  if (!profile || !profile.is_active || (profile.role !== "admin" && profile.role !== "seller")) {
    return NextResponse.redirect(new URL("/auth/exit?code=PROFILE_NOT_FOUND", request.url));
  }

  const passwordChangeRequired = isPasswordChangeRequired(user.user_metadata);

  if (profile.role === "seller") {
    const { data: seller } = await supabase
      .from("sellers")
      .select("id, is_active, status")
      .eq("profile_id", user.id)
      .maybeSingle<{ id: string; is_active: boolean; status: string | null }>();

    if (!seller) {
      return NextResponse.redirect(new URL("/auth/exit?code=SELLER_NOT_LINKED", request.url));
    }

    if (!seller.is_active || seller.status === "disabled" || seller.status === "suspended") {
      return NextResponse.redirect(new URL("/auth/exit?code=ACCOUNT_DISABLED", request.url));
    }

    if (passwordChangeRequired && !isAllowedDuringForcedPasswordUpdate(pathname)) {
      if (isApiRequest) {
        return jsonAuthError(403, "PASSWORD_CHANGE_REQUIRED", "Devi impostare una nuova password per continuare.");
      }

      return NextResponse.redirect(new URL(FORCE_PASSWORD_UPDATE_PATH, request.url));
    }
  }

  if (!isPostLoginPath && isPublicAuthPath(pathname) && pathname !== FORCE_PASSWORD_UPDATE_PATH) {
    return NextResponse.redirect(new URL(resolveRoleHome(profile.role), request.url));
  }

  if (profile.role === "seller" && isAdminPagePath(pathname)) {
    return NextResponse.redirect(new URL(SELLER_HOME_PATH, request.url));
  }

  if (profile.role === "admin" && isSellerPagePath(pathname)) {
    return NextResponse.redirect(new URL(ADMIN_HOME_PATH, request.url));
  }

  if (isApiRequest) {
    if (profile.role === "seller" && isAdminApiPath(pathname)) {
      return jsonAuthError(403, "FORBIDDEN", "Accesso negato.");
    }

    if (profile.role === "admin" && isSellerApiPath(pathname)) {
      return jsonAuthError(403, "FORBIDDEN", "Accesso negato.");
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
