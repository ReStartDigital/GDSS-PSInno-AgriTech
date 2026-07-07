import type { Request, Response, NextFunction } from "express";
import { UserRole } from "../constants/roles.enums.js";
import {
  ForbiddenException,
  UnauthorizedException,
} from "../exceptions/index.js";

/**
 * Builds a middleware that only allows the listed roles through.
 * Must run AFTER `authenticate` — relies on req.user being populated.
 *
 * Usage: router.post('/admin/x', authenticate, authorize(UserRole.ADMIN), handler)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      // Defensive — should never happen if authenticate ran first, but
      // fail safely rather than assume.
      throw new UnauthorizedException();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${allowedRoles.join(", ")}`,
      );
    }

    next();
  };
}
