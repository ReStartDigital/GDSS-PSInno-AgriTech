import { ErrorCode } from '../constants/error-codes.enum.js';

/**
 * Base class for every operational error in the app.
 * Operational = expected failure modes (wrong PIN, expired OTP) as opposed to
 * programmer errors (TypeError, undefined is not a function), which should
 * crash loudly in development and get logged as INTERNAL_ERROR in production.
 */
export class AppException extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational = true;

  constructor(statusCode: number, code: ErrorCode, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;

    // Maintains correct stack trace for where the error was thrown (V8 only)
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppException.prototype);
  }
}