# Database Setup Guide - AP Command Centre

## Prerequisites

- PostgreSQL 13 or higher installed
- Administrative access to PostgreSQL

## Option 1: Install PostgreSQL (If Not Installed)

### Windows

**Download and Install:**

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer (postgresql-16.x-windows-x64.exe)
3. Follow installation wizard:
   - Installation Directory: `C:\Program Files\PostgreSQL\16`
   - Select Components: PostgreSQL Server, pgAdmin 4, Command Line Tools
   - Data Directory: `C:\Program Files\PostgreSQL\16\data`
   - **Set Password** for postgres user (remember this!)
   - Port: `5432` (default)
   - Locale: Default locale
4. Click "Next" and "Install"

**Verify Installation:**

```bash
# Open Command Prompt
psql --version
```

Expected output: `psql (PostgreSQL) 16.x`

### Mac

**Using Homebrew:**

```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Verify installation
psql --version
```

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

## Option 2: Use Existing PostgreSQL

If PostgreSQL is already installed, just verify it's running:

### Windows

```bash
# Check if service is running
sc query postgresql-x64-16

# Start service if stopped
net start postgresql-x64-16
```



### Mac

```bash
# Check status
brew services list | grep postgresql

# Start if not running
brew services start postgresql@16
```

### Linux

```bash
# Check status
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql
```

## Step 1: Access PostgreSQL

### Windows

**Option A: Using psql command line**

```bash
# Open Command Prompt as Administrator
# Navigate to PostgreSQL bin directory
cd "C:\Program Files\PostgreSQL\16\bin"

# Connect to PostgreSQL
psql -U postgres
```

**Option B: Using pgAdmin 4**

1. Open pgAdmin 4 from Start Menu
2. Enter master password (set during installation)
3. Right-click "Servers" → Create → Server
4. Connection details:
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: (your postgres password)

### Mac/Linux

```bash
# Connect as postgres user
sudo -u postgres psql

# Or if you're the database superuser
psql postgres
```

## Step 2: Create Database

Once connected to PostgreSQL:

```sql
-- Create the database
CREATE DATABASE ap_command_centre;

-- Verify it was created
\l

-- Connect to the new database
\c ap_command_centre

-- Check connection
SELECT current_database();
```

Expected output: `ap_command_centre`

## Step 3: Create Database User (Optional but Recommended)

For security, create a dedicated user instead of using postgres:

```sql
-- Create user
CREATE USER ap_user WITH PASSWORD 'secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ap_command_centre TO ap_user;

-- Connect to the database
\c ap_command_centre

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO ap_user;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ap_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ap_user;

-- Verify user
\du
```

## Step 4: Configure Backend Environment

Navigate to backend folder and set up environment:

```bash
cd "C:\Users\Public\node projects\Ap-command-centre\backend"

# Copy environment template
copy .env.example .env

# Edit .env file with your database details
notepad .env
```

**Update DATABASE_URL in .env:**

### If using postgres user:

```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/ap_command_centre?schema=public"
```

### If using dedicated ap_user:

```env
DATABASE_URL="postgresql://ap_user:secure_password_here@localhost:5432/ap_command_centre?schema=public"
```

### Connection String Format:

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=public

Example:
postgresql://postgres:mypassword123@localhost:5432/ap_command_centre?schema=public
```

**Common variations:**

```env
# Local development (default)
DATABASE_URL="postgresql://postgres:password@localhost:5432/ap_command_centre?schema=public"

# Using IP address
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/ap_command_centre?schema=public"

# Different port
DATABASE_URL="postgresql://postgres:password@localhost:5433/ap_command_centre?schema=public"

# Remote database
DATABASE_URL="postgresql://user:password@db.example.com:5432/ap_command_centre?schema=public"
```

## Step 5: Test Database Connection

Test the connection before running migrations:

```bash
cd backend

# Install dependencies if not already done
npm install

# Test connection using Prisma
npx prisma db pull
```

**Success output:**
```
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "ap_command_centre" at "localhost:5432"
```

**Error output:**
```
Error: P1001: Can't reach database server at `localhost:5432`
```

If you see an error, check:
1. PostgreSQL service is running
2. DATABASE_URL is correct
3. Password has no special characters (or properly escaped)
4. Port number is correct
5. Database exists

## Step 6: Generate Prisma Client

Generate TypeScript types from your Prisma schema:

```bash
npm run prisma:generate
```

**Expected output:**
```
✔ Generated Prisma Client (5.x.x) to .\node_modules\@prisma\client
```

## Step 7: Run Database Migrations

Create all database tables by running migrations:

```bash
npm run prisma:migrate
```

Or manually:

```bash
npx prisma migrate dev
```

**Expected output:**
```
Applying migration `20241027000001_initial_schema`
Applying migration `20241027000002_add_approval_workflow`
Applying migration `20241027000003_add_email_intake`
Applying migration `20241028000001_add_approval_tables`

Your database is now in sync with your schema.
```

This creates these tables:
- companies
- users
- roles
- permissions
- role_permissions
- user_roles
- departments
- vendors
- gl_accounts
- invoices
- invoice_line_items
- approvals
- payments
- audit_logs
- sessions
- doa_matrix_rules
- comments
- email_intake_logs
- extracted_invoice_data

## Step 8: Verify Tables Were Created

### Using psql:

```sql
-- Connect to database
psql -U postgres -d ap_command_centre

-- List all tables
\dt

-- Describe a specific table
\d invoices

-- Count records (should be 0)
SELECT COUNT(*) FROM invoices;
```

### Using pgAdmin 4:

1. Open pgAdmin 4
2. Navigate: Servers → PostgreSQL 16 → Databases → ap_command_centre → Schemas → public → Tables
3. You should see all tables listed

### Using Prisma Studio:

```bash
cd backend
npm run prisma:studio
```

Opens browser at: http://localhost:5555

You'll see all tables in the left sidebar.

## Step 9: Seed Database (Optional)

Create initial test data:

### Create Seed Script

Create file: `backend/prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Company
  const company = await prisma.company.create({
    data: {
      name: 'Acme Corporation',
      code: 'ACME',
      email: 'admin@acme.com',
      phone: '555-0100',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
  });
  console.log('✓ Company created');

  // Create Department
  const department = await prisma.department.create({
    data: {
      name: 'Finance',
      code: 'FIN',
      companyId: company.id,
    },
  });
  console.log('✓ Department created');

  // Create Roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'Admin',
      description: 'System Administrator',
      companyId: company.id,
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: 'Manager',
      description: 'Department Manager',
      companyId: company.id,
    },
  });
  console.log('✓ Roles created');

  // Create User
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Admin',
      companyId: company.id,
      departmentId: department.id,
      isActive: true,
      roles: {
        connect: [{ id: adminRole.id }],
      },
    },
  });
  console.log('✓ User created');

  // Create Vendor
  const vendor = await prisma.vendor.create({
    data: {
      name: 'Office Supplies Inc',
      code: 'OSI',
      email: 'billing@officesupplies.com',
      phone: '555-0200',
      address: '456 Commerce St',
      city: 'Boston',
      state: 'MA',
      zipCode: '02101',
      country: 'USA',
      companyId: company.id,
    },
  });
  console.log('✓ Vendor created');

  // Create GL Account
  const glAccount = await prisma.glAccount.create({
    data: {
      accountNumber: '5001',
      accountName: 'Office Supplies',
      accountType: 'expense',
      companyId: company.id,
    },
  });
  console.log('✓ GL Account created');

  // Create Invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-001',
      vendorId: vendor.id,
      companyId: company.id,
      departmentId: department.id,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 1000.00,
      taxAmount: 80.00,
      totalAmount: 1080.00,
      amountPaid: 0,
      amountDue: 1080.00,
      currency: 'USD',
      status: 'draft',
      approvalStatus: 'not_required',
      paymentStatus: 'unpaid',
      lineItems: {
        create: [
          {
            lineNumber: 1,
            description: 'Paper Reams',
            quantity: 10,
            unitPrice: 50.00,
            amount: 500.00,
            glAccountId: glAccount.id,
          },
          {
            lineNumber: 2,
            description: 'Pens',
            quantity: 50,
            unitPrice: 10.00,
            amount: 500.00,
            glAccountId: glAccount.id,
          },
        ],
      },
    },
  });
  console.log('✓ Invoice created');

  console.log('\n✅ Database seeded successfully!\n');
  console.log('Login credentials:');
  console.log('Email: admin@acme.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Add Seed Script to package.json

Edit `backend/package.json`:

```json
{
  "scripts": {
    "seed": "ts-node prisma/seed.ts"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### Run Seed

```bash
npm run seed
```

**Expected output:**
```
✓ Company created
✓ Department created
✓ Roles created
✓ User created
✓ Vendor created
✓ GL Account created
✓ Invoice created

✅ Database seeded successfully!

Login credentials:
Email: admin@acme.com
Password: password123
```

## Step 10: Verify Setup Complete

### Check Tables Have Data

```bash
# Open Prisma Studio
npm run prisma:studio
```

Navigate to http://localhost:5555 and verify:
- ✓ Companies table has 1 record
- ✓ Users table has 1 record
- ✓ Vendors table has 1 record
- ✓ Invoices table has 1 record

### Test Login

1. Start backend: `npm run dev`
2. Start frontend: `cd ../frontend && npm run dev`
3. Open http://localhost:5173/login
4. Login with:
   - Email: `admin@acme.com`
   - Password: `password123`

## Troubleshooting

### Error: "relation does not exist"

**Cause:** Migration didn't run completely

**Solution:**
```bash
# Reset and re-run migrations
npm run prisma:migrate:reset
npm run prisma:migrate
```

### Error: "P1001: Can't reach database server"

**Cause:** PostgreSQL not running or wrong connection details

**Solution:**
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   sc query postgresql-x64-16
   
   # Mac
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Test connection manually:
   ```bash
   psql -U postgres -h localhost -p 5432
   ```

3. Check firewall isn't blocking port 5432

### Error: "password authentication failed"

**Cause:** Wrong password in DATABASE_URL

**Solution:**
1. Reset postgres password:
   ```sql
   -- As superuser
   ALTER USER postgres PASSWORD 'new_password';
   ```

2. Update `.env` with correct password

### Error: "database does not exist"

**Cause:** Database wasn't created

**Solution:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ap_command_centre;

# Verify
\l
```

### Error: Special Characters in Password

**Cause:** Password has special characters not properly escaped

**Solution:**

Encode special characters in DATABASE_URL:

```
@ → %40
# → %23
$ → %24
% → %25
^ → %5E
& → %26
```

Example:
```env
# Password: p@ssw#rd
DATABASE_URL="postgresql://postgres:p%40ssw%23rd@localhost:5432/ap_command_centre?schema=public"
```

Or use a simpler password for development.

## Database Management Commands

### Useful Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Create new migration
npx prisma migrate dev --name add_new_feature

# Reset database (deletes all data!)
npm run prisma:migrate:reset

# Open Prisma Studio
npm run prisma:studio

# Check migration status
npx prisma migrate status

# Deploy migrations (production)
npx prisma migrate deploy

# Pull current database schema
npx prisma db pull

# Push schema changes without migration
npx prisma db push
```

### Useful PostgreSQL Commands

```sql
-- List databases
\l

-- Connect to database
\c ap_command_centre

-- List tables
\dt

-- Describe table structure
\d invoices

-- Show table with details
\d+ invoices

-- Count records
SELECT COUNT(*) FROM invoices;

-- See all data
SELECT * FROM invoices;

-- Exit psql
\q
```

### Backup Database

```bash
# Backup
pg_dump -U postgres ap_command_centre > backup.sql

# Restore
psql -U postgres ap_command_centre < backup.sql
```

## Quick Reference

### Connection String Format

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=public
```

### Default PostgreSQL Settings

- **Host:** localhost
- **Port:** 5432
- **User:** postgres
- **Database:** ap_command_centre

### Environment Variable

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ap_command_centre?schema=public"
```

### Verify Setup Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `ap_command_centre` created
- [ ] User has proper permissions
- [ ] `.env` file configured with correct DATABASE_URL
- [ ] Prisma client generated
- [ ] Migrations run successfully
- [ ] All tables created
- [ ] Seed data loaded (optional)
- [ ] Can connect via Prisma Studio
- [ ] Backend starts without errors

## Summary

Your database is now set up! You should have:

1. ✅ PostgreSQL running
2. ✅ Database created: `ap_command_centre`
3. ✅ All tables created (20+ tables)
4. ✅ Test data loaded
5. ✅ Backend can connect

**Next Steps:**
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Login at http://localhost:5173/login with `admin@acme.com` / `password123`

🎉 Database setup complete!
