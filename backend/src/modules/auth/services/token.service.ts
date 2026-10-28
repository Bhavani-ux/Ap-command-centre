import jwt from 'jsonwebtoken';
import { authConfig } from '../../../config/auth.config';
import { JWTPayload } from '../../../core/types/auth.types';
import { InvalidTokenError } from '../../../core/errors/authentication.error';

export class TokenService {
  generateAccessToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      authConfig.jwt.secret,
      {
        expiresIn: authConfig.jwt.accessTokenExpiresIn,
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      }
    );
  }

  generateRefreshToken(payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh' },
      authConfig.jwt.secret,
      {
        expiresIn: authConfig.jwt.refreshTokenExpiresIn,
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      }
    );
  }

  verifyToken(token: string, type: 'access' | 'refresh'): JWTPayload {
    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret, {
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      }) as JWTPayload;

      if (decoded.type !== type) {
        throw new InvalidTokenError();
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        throw new InvalidTokenError();
      }
      throw error;
    }
  }

  decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }

  getTokenExpiryTime(token: string): number | null {
    const decoded = this.decodeToken(token);
    return decoded?.exp || null;
  }
}
