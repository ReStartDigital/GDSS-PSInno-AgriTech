import { AppException } from "./app.exceptions.js";
import { ErrorCode } from "../constants/error-codes.enum.js";

export class ValidationException extends AppException {
  public readonly details?: Record<string, string[]>;

  constructor(message: string, details?: Record<string, string[]>) {
    super(422, ErrorCode.VALIDATION_ERROR, message);
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export class UnauthorizedException extends AppException {
  constructor(
    message = "Authentication required",
    code: ErrorCode = ErrorCode.UNAUTHORIZED,
  ) {
    super(401, code, message);
  }
}

export class ForbiddenException extends AppException {
  // ✨ Added optional specific error code override
  constructor(
    message = "You do not have permission to perform this action",
    code: ErrorCode = ErrorCode.FORBIDDEN,
  ) {
    super(403, code, message);
  }
}

export class NotFoundException extends AppException {
  // ✨ Added optional specific error code override
  constructor(
    message = "Resource not found",
    code: ErrorCode = ErrorCode.NOT_FOUND,
  ) {
    super(404, code, message);
  }
}

export class ConflictException extends AppException {
  constructor(message: string, code: ErrorCode) {
    super(409, code, message);
  }
}

export class RateLimitException extends AppException {
  constructor(message = "Too many requests. Please try again later.") {
    super(429, ErrorCode.RATE_LIMIT_EXCEEDED, message);
  }
}

export class BadRequestException extends AppException {
  constructor(message: string = "Bad request.", code: ErrorCode) {
    super(400, code, message);
  }
}

/** Used specifically when an external dependency (Arkesel) rejects the request. */
export class UnprocessableException extends AppException {
  constructor(message: string, code: ErrorCode) {
    super(422, code, message);
  }
}

/** Used when an OTP has expired or expired-but-not-yet-cleaned-up. */
export class GoneException extends AppException {
  constructor(message: string, code: ErrorCode) {
    super(410, code, message);
  }
}
