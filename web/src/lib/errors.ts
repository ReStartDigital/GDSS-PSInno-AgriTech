import type { ApiErrorShape } from '../types/api'

/**
 * Extracts a user-facing message and field-level validation details from an Axios error
 * that follows the VegeLink backend error envelope:
 * `{ error: { message: string, details: Record<string, string[]> } }`.
 */
export function getApiErrorData(error: unknown) {
  if (!error) return null
  const shaped = error as ApiErrorShape
  return shaped?.response?.data?.error ?? null
}

export function getApiErrorMessage(error: unknown): string | null {
  return getApiErrorData(error)?.message ?? null
}

/**
 * Returns a display-ready error string from any unknown error value.
 * Safe to use directly in JSX as `{getDisplayError(error)}`.
 */
export function getDisplayError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return getApiErrorMessage(error) ?? fallback
}
