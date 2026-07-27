export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "ACCOUNT_DISABLED"
  | "PROFILE_NOT_FOUND"
  | "SELLER_NOT_LINKED"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

const defaultStatusByCode: Record<AppErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  ACCOUNT_DISABLED: 403,
  PROFILE_NOT_FOUND: 403,
  SELLER_NOT_LINKED: 403,
  CONFLICT: 409,
  VALIDATION_ERROR: 400,
  INTERNAL_ERROR: 500
};

export class AppError extends Error {
  code: AppErrorCode;
  status: number;

  constructor(code: AppErrorCode, message: string, status?: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status ?? defaultStatusByCode[code];
  }
}

export function toPublicError(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        error: error.code,
        message: error.message
      }
    };
  }

  return {
    status: 500,
    body: {
      error: "INTERNAL_ERROR",
      message: fallbackMessage
    }
  };
}
