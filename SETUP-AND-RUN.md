# AP Command Centre - Setup and Run Guide

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database running
- npm or yarn package manager

## Initial Setup

### 1. Database Setup

**Start PostgreSQL** and create a database:

```sql
CREATE DATABASE ap_command_centre;
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials
# Required changes:
# DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/ap_command_centre?schema=public"
# JWT_SECRET="your-super-secret-jwt-key-change-this"
```

**Generate Prisma Client:**

```bash
npm run prisma:generate
```

**Run Database Migrations:**

```bash
npm run prisma:migrate
```

This will create all tables:
- users
- companies
- roles
- permissions
- departments
- vendors
- invoices
- invoice_line_items
- approvals
- gl_accounts
- payments
- audit_logs
- sessions
- doa_matrix_rules
- comments
- email_intake_logs
- extracted_invoice_data

**Start Backend Server:**

```bash
npm run dev
```

Backend will start on: **http://localhost:3000**

### 3. Frontend Setup

Open a **new terminal window**:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will start on: **http://localhost:5173**

## Access URLs

### Main Application

**Frontend URL:** http://localhost:5173

**Backend API URL:** http://localhost:3000/api

### Available Pages

Once running, you can access:

1. **Login Page**
   - URL: http://localhost:5173/login
   - Default credentials (after seeding):
     - Email: `admin@company.com`
     - Password: `password123`

2. **Dashboard**
   - URL: http://localhost:5173/dashboard
   - Shows metrics, charts, pending approvals

3. **Invoice Tracker**
   - URL: http://localhost:5173/invoice-tracker
   - Real-time invoice monitoring
   - Pipeline view, filters, aging report

4. **Approvals**
   - URL: http://localhost:5173/approvals
   - Pending approvals
   - Approval history
   - Escalations

5. **Email Intake**
   - URL: http://localhost:5173/email-intake
   - Email processing overview
   - Processing history
   - Pending reviews

## API Endpoints to Test

### Health Check

```bash
curl http://localhost:3000/health
```

### Authentication

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "password123"
  }'
```

### Invoice Tracker (requires authentication)

```bash
# Get invoices
curl http://localhost:3000/api/invoice-tracker \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get pipeline stats
curl http://localhost:3000/api/invoice-tracker/pipeline-stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Approvals (requires authentication)

```bash
# Get pending approvals
curl http://localhost:3000/api/approval/pending \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get approval stats
curl http://localhost:3000/api/approval/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Verify Installation

### Check Backend is Running

```bash
# Should return JSON with message
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-10-28T..."
}
```

### Check Frontend is Running

Open browser and navigate to: **http://localhost:5173**

You should see the login page.

### Check Database Connection

```bash
cd backend
npm run prisma:studio
```

This opens Prisma Studio at: **http://localhost:5555**

You can browse and edit database records here.

## Seed Database (Optional)

Create seed data for testing:

```bash
cd backend

# Create seed script
npm run seed
```

Or manually create test data using Prisma Studio.

### Quick Seed via Prisma Studio

1. Open Prisma Studio: `npm run prisma:studio`
2. Navigate to http://localhost:5555
3. Create records in this order:
   - Company
   - Department
   - Role
   - User (link to company, department, roles)
   - Vendor
   - GL Account
   - Invoice
   - Invoice Line Items
   - Approvals

## Troubleshooting

### Backend Won't Start

**Issue:** `Error: P1001: Can't reach database server`

**Solution:**
1. Check PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. Test connection: `psql -U postgres -d ap_command_centre`

**Issue:** `Port 3000 already in use`

**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID_NUMBER> /F

# Or change PORT in .env
PORT=3001
```

### Frontend Won't Start

**Issue:** `Port 5173 already in use`

**Solution:**
```bash
# Vite will automatically try the next available port
# Or kill existing process
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

**Issue:** `Cannot connect to backend`

**Solution:**
1. Verify backend is running on port 3000
2. Check CORS settings in backend `.env`:
   ```
   CORS_ORIGIN=http://localhost:5173
   ```

### Database Migration Errors

**Issue:** `Migration already applied`

**Solution:**
```bash
# Reset database (WARNING: deletes all data)
npm run prisma:migrate:reset

# Or deploy specific migration
npm run prisma:migrate:deploy
```

**Issue:** `Schema drift detected`

**Solution:**
```bash
# Generate new migration
npm run prisma:migrate:dev --name fix_schema

# Or reset and re-migrate
npm run prisma:migrate:reset
```

### CORS Errors

**Issue:** `Access to fetch blocked by CORS policy`

**Solution:**
Edit `backend/.env`:
```env
CORS_ORIGIN=http://localhost:5173
```

Restart backend server.

## Development Tools

### Prisma Studio
```bash
cd backend
npm run prisma:studio
```
Opens: http://localhost:5555

### API Testing with Postman

Import collection from: `postman_collection.json` (if available)

Or use these endpoints:

**Base URL:** http://localhost:3000/api

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Browser DevTools

**Network Tab:**
- Monitor API calls
- Check request/response
- View timing

**Console Tab:**
- View client-side errors
- Check Redux state
- Debug React components

**React DevTools:**
Install extension for Chrome/Firefox to inspect React components.

## Production Build

### Backend

```bash
cd backend
npm run build
npm start
```

Runs compiled TypeScript from `dist/` folder.

### Frontend

```bash
cd frontend
npm run build
```

Creates optimized production build in `dist/` folder.

**Preview production build:**
```bash
npm run preview
```

Opens: http://localhost:4173

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ap_command_centre?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_ACCESS_TOKEN_EXPIRES_IN="15m"
JWT_REFRESH_TOKEN_EXPIRES_IN="7d"
JWT_ISSUER="ap-command-centre"
JWT_AUDIENCE="ap-command-centre-api"

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173"

# Email (for Email Intake module)
EMAIL_INTAKE_USER="invoices@yourcompany.com"
EMAIL_INTAKE_PASSWORD="your-app-password"
EMAIL_INTAKE_HOST="imap.gmail.com"
EMAIL_INTAKE_PORT="993"
EMAIL_INTAKE_TLS="true"
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
```

## Quick Start Script

Create `start.sh` (Mac/Linux) or `start.bat` (Windows):

**start.bat (Windows):**
```batch
@echo off
echo Starting AP Command Centre...

echo Starting Backend...
start cmd /k "cd backend && npm run dev"

timeout /t 5

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo Prisma Studio: Run 'npm run prisma:studio' in backend folder
echo.
```

**start.sh (Mac/Linux):**
```bash
#!/bin/bash
echo "Starting AP Command Centre..."

echo "Starting Backend..."
cd backend && npm run dev &

sleep 5

echo "Starting Frontend..."
cd ../frontend && npm run dev &

echo ""
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo "Prisma Studio: Run 'npm run prisma:studio' in backend folder"
echo ""
```

**Run:**
```bash
# Windows
start.bat

# Mac/Linux
chmod +x start.sh
./start.sh
```

## Verification Checklist

- [ ] PostgreSQL database created
- [ ] Backend dependencies installed
- [ ] Database migrations run successfully
- [ ] Backend server running on port 3000
- [ ] Frontend dependencies installed
- [ ] Frontend server running on port 5173
- [ ] Can access login page
- [ ] Can login with test credentials
- [ ] Dashboard loads successfully
- [ ] Invoice Tracker page accessible
- [ ] Approvals page accessible
- [ ] Email Intake page accessible
- [ ] API endpoints responding
- [ ] No CORS errors in console

## Support

If you encounter issues:

1. Check the error message in terminal
2. Review browser console for client errors
3. Verify environment variables are set correctly
4. Ensure database is accessible
5. Check that all migrations ran successfully
6. Verify Node.js and PostgreSQL versions

## Next Steps

After verifying the app is running:

1. **Create Test Data**
   - Use Prisma Studio to create test companies, users, vendors
   - Or create a seed script

2. **Test Authentication**
   - Login with test user
   - Verify JWT tokens work
   - Test protected routes

3. **Test Invoice Tracker**
   - Create test invoices
   - Filter and search
   - View details

4. **Test Approvals**
   - Submit invoice for approval
   - Approve/reject invoices
   - Test bulk operations

5. **Configure Email Intake**
   - Set up IMAP email account
   - Configure credentials
   - Test email processing

6. **Explore Features**
   - Dashboard metrics
   - Pipeline visualization
   - Approval workflows
   - DOA matrix configuration

Enjoy using AP Command Centre! 🚀
