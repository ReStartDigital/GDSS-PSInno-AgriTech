import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async Express handler so a rejected promise (a thrown
 * AppException, a DB error, anything) is forwarded to next() and lands in
 * errorHandlerMiddleware instead of crashing the process or hanging the
 * request. Express 4 does not do this automatically for async functions.
 *
 * Usage: router.post('/x', asyncHandler(controller.method.bind(controller)))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
