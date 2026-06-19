// Result<T, E> — services return this across boundaries instead of throwing.
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export type AppErrorCode =
  | "ADAPTER_NOT_FOUND"
  | "ADAPTER_FAILED"
  | "STORAGE_READ"
  | "STORAGE_WRITE"
  | "MIGRATION_FAILED"
  | "VALIDATION"
  | "FEATURE_DISABLED"
  | "PREMIUM_REQUIRED"
  | "UNKNOWN";

export interface AppError {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
}

export const appError = (code: AppErrorCode, message: string, cause?: unknown): AppError => ({
  code,
  message,
  ...(cause !== undefined ? { cause } : {}),
});
