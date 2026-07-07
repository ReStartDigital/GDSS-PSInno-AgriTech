import type { Request, Response, NextFunction } from "express";
import { AppException } from "../exceptions/app.exceptions.js";
import { sendError } from "../dto/api-response.dto.js";
import { ErrorCode } from "../constants/error-codes.enum.js";
import { createRequestLogger, logError } from "../utils/logger.js";

/**
 * Single global error handler. Express recognises this as an error handler
 * because it has 4 parameters — must be registered LAST, after all routes.
 *
 * Two distinct paths:
 *  1. AppException (and subclasses) — operational, expected errors. We trust
 *     their statusCode/code/message and return them directly to the client.
 *  2. Anything else — a genuine bug (TypeError, DB connection drop, etc).
 *     We log the full error server-side but NEVER leak the message or stack
 *     trace to the client. Production clients only ever see a generic
 *     "Something went wrong" message for these.
 */
export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction, // required for Express to recognise this as an error handler
): void {
  const log = createRequestLogger(req.requestId);
  const isDevelopment = process.env.NODE_ENV === "development";

  if (err instanceof AppException) {
    if (err.statusCode >= 500) {
      logError(err.message, err, { code: err.code, path: req.path });
    } else {
      log.warn(err.message, {
        code: err.code,
        statusCode: err.statusCode,
        path: req.path,
      });
    }

    const details =
      "details" in err
        ? (err as { details?: Record<string, string[]> }).details
        : undefined;
    sendError(res, err.statusCode, err.code, err.message, details);
    return;
  }

  // Unexpected error — log everything, expose nothing.
  logError("Unhandled error", err, { path: req.path, method: req.method });
  // Extract human-readable error info dynamically without breaking type boundaries
  const errorInstance = err instanceof Error ? err : new Error(String(err));

  res.status(500).json({
    status: "error",
    code: ErrorCode.INTERNAL_ERROR,
    // Turn off vague masking ONLY if we are actively working locally
    message: isDevelopment
      ? `[Dev Debug] ${errorInstance.message}`
      : "Something went wrong. Please try again.",
    // Feed the stack trace back to your Postman/Insomnia testing pane automatically
    ...(isDevelopment && {
      debug: {
        name: errorInstance.name,
        stack: errorInstance.stack?.split("\n").map((line) => line.trim()),
        context: {
          path: req.path,
          method: req.method,
          query: req.query,
          body: req.body,
        },
      },
    }),
  });
}

/**
 * Catches 404s for any route that didn't match — registered after all
 * real routes but before the error handler.
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  sendError(
    res,
    404,
    ErrorCode.NOT_FOUND,
    `No route found for ${req.method} ${req.path}`,
  );
}
