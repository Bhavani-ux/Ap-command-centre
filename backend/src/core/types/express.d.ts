import { JWTPayload } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        companyId: string;
        roles: Array<{
          id: string;
          name: string;
          permissions: Record<string, any>;
        }>;
        permissions: string[];
        sessionId?: string;
      };
    }
  }
}

export {};
