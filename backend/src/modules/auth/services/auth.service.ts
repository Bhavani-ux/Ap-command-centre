import { PrismaClient } from '@prisma/client';
import { HashUtil } from '../../../core/utils/hash.util';
import {
  InvalidCredentialsError,
  AccountInactiveError,
  AccountLockedError,
} from '../../../core/errors/authentication.error';
import { LoginRequest, LoginResponse } from '../../../core/types/auth.types';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { authConfig } from '../../../config/auth.config';

const prisma = new PrismaClient();

export class AuthService {
  private tokenService: TokenService;
  private sessionService: SessionService;

  constructor() {
    this.tokenService = new TokenService();
    this.sessionService = new SessionService();
  }

  async login(
    loginData: LoginRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: loginData.email },
      include: {
        company: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AccountInactiveError();
    }

    // Check for account lockout (simplified - in production, use a separate lockout tracking)
    // This would typically be tracked in a separate table or Redis

    // Verify password
    const isPasswordValid = await HashUtil.compare(loginData.password, user.passwordHash);

    if (!isPasswordValid) {
      // In production, increment failed login attempts here
      throw new InvalidCredentialsError();
    }

    // Extract roles and permissions
    const roles = user.userRoles.map((ur) => ur.role);
    const roleNames = roles.map((r) => r.name);

    // Flatten permissions from all roles
    const permissionsSet = new Set<string>();
    roles.forEach((role) => {
      if (role.permissions && typeof role.permissions === 'object') {
        this.extractPermissions(role.permissions).forEach((p) => permissionsSet.add(p));
      }
    });
    const permissions = Array.from(permissionsSet);

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
    };

    const accessToken = this.tokenService.generateAccessToken(tokenPayload);
    const refreshToken = this.tokenService.generateRefreshToken(tokenPayload);

    // Create session
    const sessionId = await this.sessionService.createSession(
      user.id,
      refreshToken,
      ipAddress,
      userAgent
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Calculate token expiry
    const expiresIn = this.calculateExpirySeconds(authConfig.jwt.accessTokenExpiresIn);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        roles: roleNames,
        permissions,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    // Verify refresh token
    const payload = this.tokenService.verifyToken(refreshToken, 'refresh');

    // Validate session
    if (payload.sessionId) {
      const isValid = await this.sessionService.validateSession(payload.sessionId, payload.userId);
      if (!isValid) {
        throw new InvalidCredentialsError();
      }
    }

    // Get user to ensure still active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      throw new AccountInactiveError();
    }

    // Generate new access token
    const accessToken = this.tokenService.generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      companyId: payload.companyId,
    });

    const expiresIn = this.calculateExpirySeconds(authConfig.jwt.accessTokenExpiresIn);

    return { accessToken, expiresIn };
  }

  async logout(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.sessionService.deleteSession(sessionId);
    } else {
      await this.sessionService.deleteUserSessions(userId);
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Verify current password
    const isPasswordValid = await HashUtil.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Hash new password
    const hashedPassword = await HashUtil.hash(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    // Invalidate all sessions except current
    await this.sessionService.deleteUserSessions(userId);
  }

  async validateUser(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  private extractPermissions(permissionsObj: any, prefix = ''): string[] {
    const permissions: string[] = [];

    Object.keys(permissionsObj).forEach((key) => {
      const value = permissionsObj[key];
      const fullKey = prefix ? `${prefix}:${key}` : key;

      if (Array.isArray(value)) {
        // If it's an array of actions, create permission strings
        value.forEach((action) => {
          permissions.push(`${fullKey}:${action}`);
        });
      } else if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        permissions.push(...this.extractPermissions(value, fullKey));
      }
    });

    return permissions;
  }

  private calculateExpirySeconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 60);
  }
}
