import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { authConfig } from '../../../config/auth.config';

const prisma = new PrismaClient();

export class SessionService {
  async createSession(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + authConfig.session.sessionTimeout);

    // Clean up old sessions if max limit reached
    await this.cleanupOldSessions(userId);

    await prisma.$executeRawUnsafe(
      `INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      sessionId,
      userId,
      token,
      ipAddress,
      userAgent,
      expiresAt
    );

    return sessionId;
  }

  async getSession(sessionId: string): Promise<any | null> {
    const result = await prisma.$queryRawUnsafe(
      `SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW()`,
      sessionId
    );

    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  async validateSession(sessionId: string, userId: string): Promise<boolean> {
    const result = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM sessions
       WHERE id = $1 AND user_id = $2 AND expires_at > NOW()`,
      sessionId,
      userId
    );

    return Array.isArray(result) && result.length > 0 && result[0].count > 0;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await prisma.$executeRawUnsafe(`DELETE FROM sessions WHERE id = $1`, sessionId);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await prisma.$executeRawUnsafe(`DELETE FROM sessions WHERE user_id = $1`, userId);
  }

  async cleanupOldSessions(userId: string): Promise<void> {
    const result: any[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM sessions WHERE user_id = $1 ORDER BY created_at DESC`,
      userId
    );

    if (result.length >= authConfig.session.maxActiveSessions) {
      const sessionsToDelete = result.slice(authConfig.session.maxActiveSessions - 1);
      const sessionIds = sessionsToDelete.map((s) => s.id);

      if (sessionIds.length > 0) {
        await prisma.$executeRawUnsafe(
          `DELETE FROM sessions WHERE id = ANY($1::uuid[])`,
          sessionIds
        );
      }
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    await prisma.$executeRawUnsafe(`DELETE FROM sessions WHERE expires_at <= NOW()`);
  }
}
