import { AppRole } from "@/lib/internal-kpi/types";

export const PASSWORD_CHANGE_REQUIRED_KEY = "password_change_required";
export const PASSWORD_CHANGED_AT_KEY = "password_changed_at";
export const TEMPORARY_PASSWORD_ISSUED_AT_KEY = "temporary_password_issued_at";
export const FORCE_PASSWORD_UPDATE_PATH = "/update-password";

export function isPasswordChangeRequired(userMetadata: unknown) {
  if (!userMetadata || typeof userMetadata !== "object") {
    return false;
  }

  return (userMetadata as Record<string, unknown>)[PASSWORD_CHANGE_REQUIRED_KEY] === true;
}

export function resolvePostAuthRedirect(
  role: AppRole,
  nextPath: string | null | undefined,
  passwordChangeRequired: boolean,
  fallbackResolver: (role: AppRole, nextPath: string | null | undefined) => string
) {
  if (passwordChangeRequired && role === "seller") {
    return FORCE_PASSWORD_UPDATE_PATH;
  }

  return fallbackResolver(role, nextPath);
}

export function buildTemporaryPasswordMetadata(input?: {
  firstName?: string;
  lastName?: string;
}) {
  return {
    first_name: input?.firstName ?? "",
    last_name: input?.lastName ?? "",
    [PASSWORD_CHANGE_REQUIRED_KEY]: true,
    [TEMPORARY_PASSWORD_ISSUED_AT_KEY]: new Date().toISOString()
  };
}

export function buildCompletedPasswordMetadata(input?: {
  firstName?: string;
  lastName?: string;
}) {
  return {
    first_name: input?.firstName ?? "",
    last_name: input?.lastName ?? "",
    [PASSWORD_CHANGE_REQUIRED_KEY]: false,
    [PASSWORD_CHANGED_AT_KEY]: new Date().toISOString()
  };
}
