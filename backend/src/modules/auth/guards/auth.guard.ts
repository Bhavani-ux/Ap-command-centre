import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { SessionService } from '../services/session.service';
import { AuthService } from '../services/auth.service';
import { InvalidTokenError } from '../../../core/errors/authentication.error';

export class AuthGuard {
  private tokenService: TokenService;
  private sessionService: SessionService;
  private authService: AuthService;

  constructor() {
    this.tokenService = new TokenService();
    this.sessionService = new SessionService();
    this.authService = new AuthService();
  }

  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new InvalidTokenError();
      }

      const token = authHeader.substring(7);

      // Verify token
      const payload = this.tokenService.verifyToken(token, 'access');

      // Validate session if sessionId exists
      if (payload.sessionId) {
        const isValid = await this.sessionService.validateSession(
          payload.sessionId,
          payload.userId
        );

        if (!isValid) {
          throw new InvalidTokenError();
        }
      }

      // Get user details with roles and permissions
      const user = await this.authService.validateUser(payload.userId);

      if (!user) {
        throw new InvalidTokenError();
      }

      // Extract roles and permissions
      const roles = user.userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: ur.role.permissions,
      }));

      const permissionsSet = new Set<string>();
      roles.forEach((role: any) => {
        if (role.permissions && typeof role.permissions === 'object') {
          this.extractPermissions(role.permissions).forEach((p) => permissionsSet.add(p));
        }
      });

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        roles,
        permissions: Array.from(permissionsSet),
        sessionId: payload.sessionId,
      };

      next();
    } catch (error) {
      next(error);
    }
  };

  private extractPermissions(permissionsObj: any, prefix = ''): string[] {
    const permissions: string[] = [];

    Object.keys(permissionsObj).forEach((key) => {
      const value = permissionsObj[key];
      const fullKey = prefix ? `${prefix}:${key}` : key;

      if (Array.isArray(value)) {
        value.forEach((action) => {
          permissions.push(`${fullKey}:${action}`);
        });
      } else if (typeof value === 'object' && value !== null) {
        permissions.push(...this.extractPermissions(value, fullKey));
      }
    });

    return permissions;
  }
}
