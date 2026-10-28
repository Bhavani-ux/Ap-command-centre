import { Request, Response, NextFunction } from 'express';
import { InsufficientRoleError } from '../../../core/errors/authorization.error';

export class RoleGuard {
  static hasRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new InsufficientRoleError();
        }

        const userRoles = req.user.roles.map((r) => r.name);
        const hasRequiredRole = roles.some((role) => userRoles.includes(role));

        if (!hasRequiredRole) {
          throw new InsufficientRoleError(roles.join(', '));
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
