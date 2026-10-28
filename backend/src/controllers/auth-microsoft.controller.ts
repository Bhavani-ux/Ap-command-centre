import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Azure AD configuration
const AZURE_AD_CONFIG = {
  clientId: process.env.AZURE_CLIENT_ID || '',
  clientSecret: process.env.AZURE_CLIENT_SECRET || '',
  tenantId: process.env.AZURE_TENANT_ID || 'common',
  redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:3001/api/auth/microsoft/callback',
};

interface AzureTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

interface AzureUserInfo {
  id: string;
  mail: string;
  displayName: string;
  givenName: string;
  surname: string;
}

export class AuthMicrosoftController {
  // Step 1: Redirect to Microsoft login
  async initiateLogin(req: Request, res: Response) {
    try {
      const { roleCode } = req.query;

      if (!roleCode) {
        return res.status(400).json({
          success: false,
          message: 'Role code is required',
        });
      }

      // Check if Azure AD is configured
      if (!AZURE_AD_CONFIG.clientId || !AZURE_AD_CONFIG.clientSecret) {
        return res.status(503).json({
          success: false,
          message: 'Microsoft SSO is not configured. Please contact system administrator.',
        });
      }

      const authUrl = `https://login.microsoftonline.com/${AZURE_AD_CONFIG.tenantId}/oauth2/v2.0/authorize`;
      const params = new URLSearchParams({
        client_id: AZURE_AD_CONFIG.clientId,
        response_type: 'code',
        redirect_uri: AZURE_AD_CONFIG.redirectUri,
        response_mode: 'query',
        scope: 'openid profile email User.Read',
        state: JSON.stringify({ roleCode }), // Pass role code through state
      });

      res.redirect(`${authUrl}?${params.toString()}`);
    } catch (error: any) {
      console.error('Error initiating Microsoft login:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate Microsoft login',
      });
    }
  }

  // Step 2: Handle OAuth callback
  async handleCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.redirect(`/login?error=no_code`);
      }

      // Parse state to get role code
      const stateData = state ? JSON.parse(state as string) : {};
      const requestedRoleCode = stateData.roleCode;

      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForToken(code as string);

      // Get user info from Microsoft Graph
      const userInfo = await this.getUserInfo(tokenResponse.access_token);

      // Find user in database by Azure AD ID or email
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { azureAdId: userInfo.id },
            { email: userInfo.mail },
          ],
        },
        include: {
          roles: true,
          company: true,
        },
      });

      if (!user) {
        // User not found - redirect to login with error
        return res.redirect(`/login?error=user_not_found&email=${encodeURIComponent(userInfo.mail)}`);
      }

      // Update Azure AD ID if not set
      if (!user.azureAdId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { azureAdId: userInfo.id },
          include: {
            roles: true,
            company: true,
          },
        });
      }

      // Check if user has the requested role
      if (requestedRoleCode) {
        const hasRole = user.roles.some((role) => role.code === requestedRoleCode);
        if (!hasRole) {
          // User doesn't have this role - redirect with error
          return res.redirect(`/login?error=unauthorized_role&roleCode=${requestedRoleCode}`);
        }
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate JWT tokens
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          companyId: user.companyId,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
      );

      // Create session
      await prisma.session.create({
        data: {
          userId: user.id,
          accessToken: accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Format user data
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        companyId: user.companyId,
        companyName: user.company.name,
        roles: user.roles.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
        })),
      };

      // Redirect to frontend with tokens in URL hash (secure client-side only)
      const redirectUrl = `/auth/callback#` +
        `accessToken=${encodeURIComponent(accessToken)}` +
        `&refreshToken=${encodeURIComponent(refreshToken)}` +
        `&user=${encodeURIComponent(JSON.stringify(userData))}`;

      res.redirect(redirectUrl);
    } catch (error: any) {
      console.error('Error handling Microsoft callback:', error);
      res.redirect(`/login?error=auth_failed`);
    }
  }

  // Exchange authorization code for access token
  private async exchangeCodeForToken(code: string): Promise<AzureTokenResponse> {
    const tokenUrl = `https://login.microsoftonline.com/${AZURE_AD_CONFIG.tenantId}/oauth2/v2.0/token`;

    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        client_id: AZURE_AD_CONFIG.clientId,
        client_secret: AZURE_AD_CONFIG.clientSecret,
        code,
        redirect_uri: AZURE_AD_CONFIG.redirectUri,
        grant_type: 'authorization_code',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    return response.data;
  }

  // Get user info from Microsoft Graph API
  private async getUserInfo(accessToken: string): Promise<AzureUserInfo> {
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return response.data;
  }
}

export const authMicrosoftController = new AuthMicrosoftController();
