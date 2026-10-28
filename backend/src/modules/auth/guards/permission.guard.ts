import { Request, Response, NextFunction } from 'express';
import { InsufficientPermissionsError } from '../../../core/errors/authorization.error';

export class PermissionGuard {
  static hasPermission(...permissions: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new InsufficientPermissionsError();
        }

        const userPermissions = req.user.permissions;

        // Check if user has all required permissions
        const hasAllPermissions = permissions.every((permission) =>
          userPermissions.some((up) => this.matchesPermission(up, permission))
        );

        if (!hasAllPermissions) {
          throw new InsufficientPermissionsError(permissions.join(', '));
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static hasAnyPermission(...permissions: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new InsufficientPermissionsError();
        }

        const userPermissions = req.user.permissions;

        // Check if user has any of the required permissions
        const hasAnyPermission = permissions.some((permission) =>
          userPermissions.some((up) => this.matchesPermission(up, permission))
        );

        if (!hasAnyPermission) {
          throw new InsufficientPermissionsError(permissions.join(' or '));
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  private static matchesPermission(userPermission: string, requiredPermission: string): boolean {
    // Exact match
    if (userPermission === requiredPermission) {
      return true;
    }

    // Wildcard match (e.g., "invoices:*" matches "invoices:create")
    if (userPermission.endsWith(':*')) {
      const basePermission = userPermission.slice(0, -2);
      return requiredPermission.startsWith(basePermission);
    }

    // Super wildcard (e.g., "*" matches everything)
    if (userPermission === '*') {
      return true;
    }

    return false;
  }
}
