import type { Request, Response, NextFunction, RequestHandler } from "express";
import { type ZodSchema, ZodError } from "zod";
import { ValidationException } from "../exceptions/index.js";

type ValidationTarget = "body" | "query" | "params";

/**
 * Builds an Express middleware that validates and replaces req[target] with
 * the Zod-parsed (and therefore type-coerced/trimmed) result.
 *
 * This is the ONLY place request shape validation happens — controllers can
 * trust req.body is already shaped correctly by the time they run.
 */
export function validate(
  schema: ZodSchema,
  target: ValidationTarget = "body",
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      throw new ValidationException(
        "Request validation failed",
        flattenZodError(result.error),
      );
    }

    // Replace with parsed data so defaults/transforms (e.g. phone normalisation) take effect
    req[target] = result.data;
    next();
  };
}

function flattenZodError(error: ZodError): Record<string, string[]> {
  const flattened: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!flattened[path]) flattened[path] = [];
    flattened[path].push(issue.message);
  }
  return flattened;
}
