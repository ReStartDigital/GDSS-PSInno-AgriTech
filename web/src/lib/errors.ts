import type { ApiErrorShape } from '../types/api'

/**
 * Extracts a user-facing message from an Axios error that follows the
 * VegeLink backend error envelope: `{ error: { message: string } }`.
 *
 * Falls back to a generic message if the error is not in the expected shape.
 */
export function getApiErrorMessage(error: unknown): string | null {
  if (!error) return null
  const shaped = error as ApiErrorShape
  return shaped?.response?.data?.error?.message ?? null
}

/**
 * Returns a display-ready error string from any unknown error value.
 * Safe to use directly in JSX as `{getDisplayError(error)}`.
 */
export function getDisplayError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return getApiErrorMessage(error) ?? fallback
}
