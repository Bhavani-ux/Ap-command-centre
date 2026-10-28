import { config } from 'dotenv';

config();

export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'ap-command-centre',
    audience: process.env.JWT_AUDIENCE || 'ap-command-centre-api',
  },
  password: {
    saltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS || '10', 10),
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  session: {
    maxActiveSessions: 5,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },
  lockout: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
};
