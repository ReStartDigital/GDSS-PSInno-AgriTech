import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

/**
 * Attaches a unique request ID to every incoming request. Used for log
 * correlation (every log line for one request shares this ID) and returned
 * in the response header so a user-reported bug can be traced end to end.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.headers["x-request-id"];
  req.requestId =
    typeof incoming === "string" && incoming.length > 0 ? incoming : uuidv4();
  res.setHeader("x-request-id", req.requestId);
  next();
}
