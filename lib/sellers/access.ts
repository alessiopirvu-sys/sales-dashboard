import { z } from "zod";

export const platformAccountStateSchema = z.enum(["none", "active", "disabled"]);
const sellerSheetsMapSchema = z.record(z.string(), z.string()).default({});

export type PlatformAccountState = z.infer<typeof platformAccountStateSchema>;

export const sellerPlatformAccessSchema = z
  .object({
    email: z.string().trim().default(""),
    password: z.string().default(""),
    confirmPassword: z.string().default(""),
    accountStatus: platformAccountStateSchema.default("none")
  })
  .strict()
  .superRefine((value, context) => {
    const email = value.email.trim();
    const password = value.password;
    const confirmPassword = value.confirmPassword;
    const hasEmail = email.length > 0;
    const hasPassword = password.length > 0;
    const hasConfirmPassword = confirmPassword.length > 0;

    if (hasEmail) {
      const emailResult = z.string().email().safeParse(email);
      if (!emailResult.success) {
        context.addIssue({
          code: "custom",
          message: "Inserisci un'email valida.",
          path: ["email"]
        });
      }
    }

    if (hasPassword && !isStrongTemporaryPassword(password)) {
      context.addIssue({
        code: "custom",
        message: "La password deve contenere almeno 8 caratteri, una lettera e un numero.",
        path: ["password"]
      });
    }

    if ((hasPassword || hasConfirmPassword) && password !== confirmPassword) {
      context.addIssue({
        code: "custom",
        message: "Le password non coincidono.",
        path: ["confirmPassword"]
      });
    }
  });

export const sellerUpsertRequestSchema = z
  .object({
    name: z.string().trim().min(1, "Il nome venditore e obbligatorio."),
    sheets: sellerSheetsMapSchema.optional(),
    access: sellerPlatformAccessSchema.optional()
  })
  .strict();

export type SellerPlatformAccessInput = z.infer<typeof sellerPlatformAccessSchema>;
export type SellerUpsertRequest = z.infer<typeof sellerUpsertRequestSchema>;

export type SellerAccountPlan =
  | {
      kind: "none";
      email: null;
      password: null;
      nextIsActive: boolean | null;
      nextStatus: PlatformAccountState;
    }
  | {
      kind: "create";
      email: string;
      password: string;
      nextIsActive: boolean;
      nextStatus: Exclude<PlatformAccountState, "none">;
    }
  | {
      kind: "update";
      email: string;
      password: string | null;
      nextIsActive: boolean;
      nextStatus: Exclude<PlatformAccountState, "none">;
      emailChanged: boolean;
      passwordChanged: boolean;
      statusChanged: boolean;
    };

export function isStrongTemporaryPassword(password: string) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function isSellerAccessConfigurationEmpty(access?: Partial<SellerPlatformAccessInput> | null) {
  const normalized = normalizeAccessInput(access);

  return (
    normalized.email.length === 0 &&
    normalized.password.length === 0 &&
    normalized.confirmPassword.length === 0 &&
    normalized.accountStatus === "none"
  );
}

function normalizeAccessInput(access?: Partial<SellerPlatformAccessInput> | null) {
  return {
    email: access?.email?.trim().toLowerCase() ?? "",
    password: access?.password ?? "",
    confirmPassword: access?.confirmPassword ?? "",
    accountStatus: access?.accountStatus ?? "none"
  } satisfies SellerPlatformAccessInput;
}

export function buildSellerAccountPlan(
  access: Partial<SellerPlatformAccessInput> | null | undefined,
  options: {
    hasLinkedAccount: boolean;
    currentEmail?: string | null;
    currentIsActive?: boolean;
  }
): SellerAccountPlan {
  const normalized = normalizeAccessInput(access);
  const accessValidation = sellerPlatformAccessSchema.safeParse(normalized);

  if (!accessValidation.success) {
    throw new Error(accessValidation.error.issues[0]?.message ?? "Dati accesso non validi.");
  }

  const { email, password, accountStatus } = accessValidation.data;
  const hasEmail = email.length > 0;
  const hasPassword = password.length > 0;
  const nextStatus = accountStatus === "none" ? "active" : accountStatus;
  const nextIsActive = nextStatus === "active";

  if (!options.hasLinkedAccount) {
    if (!hasEmail && !hasPassword) {
      return {
        kind: "none",
        email: null,
        password: null,
        nextIsActive: null,
        nextStatus: accountStatus
      };
    }

    if (!hasEmail) {
      throw new Error("Inserisci l'email di accesso.");
    }

    if (!hasPassword) {
      throw new Error("Inserisci una password temporanea valida.");
    }

    return {
      kind: "create",
      email,
      password,
      nextIsActive,
      nextStatus
    };
  }

  if (!hasEmail) {
    throw new Error("L'account collegato deve avere un'email valida.");
  }

  const currentEmail = options.currentEmail?.trim().toLowerCase() ?? "";
  const currentIsActive = options.currentIsActive ?? true;
  const emailChanged = email !== currentEmail;
  const passwordChanged = hasPassword;
  const statusChanged = nextIsActive !== currentIsActive;

  if (!emailChanged && !passwordChanged && !statusChanged) {
    return {
      kind: "none",
      email: null,
      password: null,
      nextIsActive,
      nextStatus
    };
  }

  return {
    kind: "update",
    email,
    password: passwordChanged ? password : null,
    nextIsActive,
    nextStatus,
    emailChanged,
    passwordChanged,
    statusChanged
  };
}
