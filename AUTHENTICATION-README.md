# Authentication Module - Complete Implementation

## Overview

This is a production-ready JWT-based authentication system with role-based access control (RBAC) for the AP Command Centre application.

## Features

✅ JWT Authentication (Access + Refresh Tokens)
✅ Role-Based Access Control (RBAC)
✅ Permission-Based Authorization
✅ Session Management
✅ Secure Password Hashing (bcrypt)
✅ Token Refresh Mechanism
✅ Protected Routes
✅ Role-Based Navigation
✅ Redux State Management
✅ Automatic Token Refresh on 401
✅ Local Storage Persistence

## Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   └── auth.config.ts                 # Auth configuration
│   ├── core/
│   │   ├── errors/
│   │   │   ├── authentication.error.ts    # Auth error classes
│   │   │   └── authorization.error.ts     # Authz error classes
│   │   ├── types/
│   │   │   ├── auth.types.ts             # Auth type definitions
│   │   │   └── express.d.ts              # Express type extensions
│   │   └── utils/
│   │       └── hash.util.ts              # Password hashing utility
│   └── modules/
│       └── auth/
│           ├── controllers/
│           │   └── auth.controller.ts     # Auth endpoints
│           ├── services/
│           │   ├── auth.service.ts        # Auth business logic
│           │   ├── token.service.ts       # JWT token management
│           │   └── session.service.ts     # Session management
│           ├── guards/
│           │   ├── auth.guard.ts          # Authentication guard
│           │   ├── role.guard.ts          # Role authorization guard
│           │   └── permission.guard.ts    # Permission authorization guard
│           └── auth.routes.ts             # Auth routes
```

## Frontend Structure

```
frontend/
├── src/
│   ├── config/
│   │   └── api.config.ts                 # API configuration
│   ├── types/
│   │   └── auth.types.ts                 # Auth type definitions
│   ├── services/
│   │   ├── api/
│   │   │   └── client.ts                 # Axios client with interceptors
│   │   └── auth/
│   │       └── auth.service.ts           # Auth API calls
│   ├── store/
│   │   ├── slices/
│   │   │   └── auth.slice.ts             # Redux auth slice
│   │   └── store.ts                      # Redux store configuration
│   ├── hooks/
│   │   └── auth/
│   │       └── useAuth.ts                # Auth hook
│   ├── routes/
│   │   ├── AppRoutes.tsx                 # Main routes
│   │   ├── PrivateRoute.tsx              # Auth-protected routes
│   │   └── RoleBasedRoute.tsx            # Role-protected routes
│   ├── layouts/
│   │   ├── AuthLayout/
│   │   │   └── AuthLayout.tsx            # Login layout
│   │   └── DashboardLayout/
│   │       ├── DashboardLayout.tsx       # Main app layout
│   │       ├── Sidebar.tsx               # Role-based sidebar
│   │       └── Header.tsx                # App header
│   └── pages/
│       ├── auth/
│       │   └── Login/
│       │       └── LoginPage.tsx         # Login page
│       ├── dashboard/
│       │   └── DashboardPage.tsx         # Dashboard
│       └── error/
│           ├── NotFoundPage.tsx          # 404 page
│           └── ForbiddenPage.tsx         # 403 page
```

## Setup Instructions

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Run Database Migrations**
```bash
npm run prisma:migrate
```

4. **Generate Prisma Client**
```bash
npm run prisma:generate
```

5. **Start Development Server**
```bash
npm run dev
```

Backend will run on http://localhost:3000

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env if needed
```

3. **Start Development Server**
```bash
npm run dev
```

Frontend will run on http://localhost:5173

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/refresh` | Refresh access token | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |

### Login Request
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```

### Login Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "companyId": "uuid",
      "roles": ["ap_clerk"],
      "permissions": ["invoices:create", "invoices:read"]
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
  }
}
```

## Usage Examples

### Backend - Protecting Routes

```typescript
import { Router } from 'express';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { RoleGuard } from './modules/auth/guards/role.guard';
import { PermissionGuard } from './modules/auth/guards/permission.guard';

const router = Router();
const authGuard = new AuthGuard();

// Require authentication only
router.get('/profile', authGuard.authenticate, profileController.getProfile);

// Require specific role
router.get(
  '/admin/settings',
  authGuard.authenticate,
  RoleGuard.hasRole('admin', 'company_admin'),
  settingsController.getSettings
);

// Require specific permission
router.post(
  '/invoices',
  authGuard.authenticate,
  PermissionGuard.hasPermission('invoices:create'),
  invoiceController.create
);

// Require any of multiple permissions
router.get(
  '/reports',
  authGuard.authenticate,
  PermissionGuard.hasAnyPermission('reports:read:all', 'reports:read:department'),
  reportsController.getReports
);
```

### Frontend - Using Auth Hook

```typescript
import { useAuth } from '../hooks/auth/useAuth';

function MyComponent() {
  const { user, isAuthenticated, hasPermission, hasRole, logout } = useAuth();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  // Check if user has specific role
  if (hasRole('admin')) {
    // Show admin features
  }

  // Check if user has specific permission
  if (hasPermission('invoices:create')) {
    return <button>Create Invoice</button>;
  }

  // Logout
  const handleLogout = () => {
    logout();
  };

  return <div>Welcome {user?.firstName}!</div>;
}
```

### Frontend - Protected Routes

```typescript
import { PrivateRoute } from './routes/PrivateRoute';
import { RoleBasedRoute } from './routes/RoleBasedRoute';

// Require authentication only
<Route element={<PrivateRoute />}>
  <Route path="/dashboard" element={<DashboardPage />} />
</Route>

// Require specific roles
<Route element={<PrivateRoute />}>
  <Route element={<RoleBasedRoute roles={['admin', 'company_admin']} />}>
    <Route path="/settings" element={<SettingsPage />} />
  </Route>
</Route>
```

## Security Features

### Password Security
- Bcrypt hashing with configurable salt rounds
- Minimum password requirements (8 chars, uppercase, lowercase, numbers, special chars)
- Password history tracking (prevent reuse)

### Token Security
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Token rotation on refresh
- JWT signature verification
- Issuer and audience validation

### Session Management
- Session tracking with IP and user agent
- Maximum active sessions per user (5)
- Automatic session cleanup
- Session expiration (30 minutes)

### Account Protection
- Account lockout after failed login attempts (5 attempts)
- Lockout duration (15 minutes)
- Active account verification

## Permission System

### Permission Format
```
resource:action:scope
```

Examples:
- `invoices:create:all` - Create any invoice
- `invoices:read:department` - Read department invoices
- `invoices:approve:level1` - Approve level 1
- `*` - All permissions (super admin)

### Wildcard Matching
- `invoices:*` - All invoice actions
- `*:read` - Read all resources
- `*` - Super admin (all permissions)

## Testing

### Test User Credentials
Create a test user in your database:

```sql
-- Password: Test123!@#
INSERT INTO users (id, company_id, email, first_name, last_name, password_hash, is_active)
VALUES (
  gen_random_uuid(),
  'your-company-id',
  'test@example.com',
  'Test',
  'User',
  '$2b$10$YourHashedPasswordHere',
  true
);
```

### Manual Testing

1. **Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

2. **Access Protected Route**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

3. **Refresh Token**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

## Troubleshooting

### Issue: 401 Unauthorized
- Check if access token is valid and not expired
- Verify Authorization header format: `Bearer <token>`
- Check if user account is active

### Issue: 403 Forbidden
- Verify user has required role or permission
- Check role/permission configuration in database
- Ensure permission format is correct

### Issue: Token Refresh Fails
- Check if refresh token is valid
- Verify session exists and not expired
- Check database connection

## Production Considerations

### Environment Variables
- Use strong JWT secret (minimum 32 characters)
- Set appropriate token expiry times
- Configure CORS for production domain
- Enable HTTPS only
- Set secure cookie flags

### Security Headers
```typescript
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

app.post('/api/auth/login', loginLimiter, authController.login);
```

## Next Steps

1. Add email verification
2. Implement forgot password flow
3. Add two-factor authentication (2FA)
4. Implement OAuth/SSO integration
5. Add audit logging for auth events
6. Implement device management
7. Add password policy configuration
8. Implement session management UI

## Support

For issues or questions, please contact the development team.
