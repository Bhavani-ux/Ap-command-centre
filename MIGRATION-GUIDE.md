# Database Migration Guide

## Prerequisites

1. PostgreSQL 14+ installed
2. Node.js 18+ installed
3. Prisma CLI installed: `npm install -g prisma`

## Setup Instructions

### 1. Environment Configuration

Create `.env` file in project root:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ap_command_centre?schema=public"
```

### 2. Install Dependencies

```bash
npm install @prisma/client
npm install -D prisma
```

### 3. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Apply migration
npx prisma migrate deploy
```

### 4. Seed Initial Data (Optional)

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create default company
  const company = await prisma.company.create({
    data: {
      name: 'Acme Corporation',
      legalName: 'Acme Corporation Inc.',
      currency: 'USD',
      isActive: true,
    },
  });

  // Create default roles
  const adminRole = await prisma.role.create({
    data: {
      companyId: company.id,
      name: 'Admin',
      description: 'Full system access',
      permissions: {
        invoices: ['create', 'read', 'update', 'delete', 'approve'],
        payments: ['create', 'read', 'update', 'delete', 'approve'],
        vendors: ['create', 'read', 'update', 'delete'],
        users: ['create', 'read', 'update', 'delete'],
        reports: ['read', 'export'],
      },
      isSystemRole: true,
    },
  });

  const approverRole = await prisma.role.create({
    data: {
      companyId: company.id,
      name: 'Approver',
      description: 'Can approve invoices',
      permissions: {
        invoices: ['read', 'approve'],
        vendors: ['read'],
        reports: ['read'],
      },
      isSystemRole: true,
    },
  });

  const clerkRole = await prisma.role.create({
    data: {
      companyId: company.id,
      name: 'AP Clerk',
      description: 'Can manage invoices and payments',
      permissions: {
        invoices: ['create', 'read', 'update'],
        payments: ['create', 'read', 'update'],
        vendors: ['create', 'read', 'update'],
        reports: ['read'],
      },
      isSystemRole: true,
    },
  });

  const viewerRole = await prisma.role.create({
    data: {
      companyId: company.id,
      name: 'Viewer',
      description: 'Read-only access',
      permissions: {
        invoices: ['read'],
        vendors: ['read'],
        reports: ['read'],
      },
      isSystemRole: true,
    },
  });

  // Create default admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'admin@example.com',
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash,
      isActive: true,
    },
  });

  // Assign admin role
  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // Create sample GL accounts
  const accounts = [
    { number: '1000', name: 'Assets', type: 'asset' },
    { number: '1100', name: 'Cash', type: 'asset', parent: '1000' },
    { number: '2000', name: 'Liabilities', type: 'liability' },
    { number: '2100', name: 'Accounts Payable', type: 'liability', parent: '2000' },
    { number: '5000', name: 'Expenses', type: 'expense' },
    { number: '5100', name: 'Office Supplies', type: 'expense', parent: '5000' },
    { number: '5200', name: 'Utilities', type: 'expense', parent: '5000' },
  ];

  const glAccountMap = new Map();

  for (const account of accounts) {
    const glAccount = await prisma.gLAccount.create({
      data: {
        companyId: company.id,
        accountNumber: account.number,
        accountName: account.name,
        accountType: account.type,
        parentId: account.parent ? glAccountMap.get(account.parent) : null,
        isActive: true,
      },
    });
    glAccountMap.set(account.number, glAccount.id);
  }

  // Create sample department
  await prisma.department.create({
    data: {
      companyId: company.id,
      code: 'FIN',
      name: 'Finance',
      isActive: true,
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run seed:

```bash
npx prisma db seed
```

## Database Indexes Rationale

### High-Priority Indexes

1. **Foreign Key Indexes**
   - All foreign keys indexed for JOIN performance
   - Critical for multi-tenant queries with `company_id`

2. **Query Filter Indexes**
   - Status fields (invoice.status, payment.status)
   - Date fields (invoice_date, due_date, payment_date)
   - Boolean flags (is_active, is_primary)

3. **Composite Indexes**
   - `(company_id, vendor_code)` - Vendor lookups
   - `(company_id, invoice_number)` - Invoice lookups
   - `(company_id, account_number)` - GL account lookups

4. **Search Indexes**
   - `vendors.name` - Vendor search
   - `users.email` - User authentication

### Index Maintenance

```sql
-- Analyze index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey';

-- Reindex all tables
REINDEX DATABASE ap_command_centre;
```

## Performance Optimization

### 1. Partitioning Strategy (Future)

For large datasets, consider partitioning:

```sql
-- Partition invoices by year
CREATE TABLE invoices_2024 PARTITION OF invoices
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE invoices_2025 PARTITION OF invoices
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### 2. Materialized Views

Create for reporting queries:

```sql
-- Monthly invoice summary
CREATE MATERIALIZED VIEW mv_monthly_invoice_summary AS
SELECT
  company_id,
  vendor_id,
  DATE_TRUNC('month', invoice_date) as month,
  COUNT(*) as invoice_count,
  SUM(total_amount) as total_amount,
  SUM(amount_paid) as amount_paid,
  SUM(amount_due) as amount_due
FROM invoices
GROUP BY company_id, vendor_id, DATE_TRUNC('month', invoice_date);

-- Refresh strategy
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_invoice_summary;
```

### 3. Query Optimization

```sql
-- Enable query timing
SET track_activity_query_size = 4096;
SET log_min_duration_statement = 1000; -- Log queries > 1 second

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM invoices WHERE company_id = '...' AND status = 'pending_approval';
```

## Backup Strategy

### Daily Backup

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="ap_command_centre"

pg_dump -U postgres -d $DB_NAME -F c -f "$BACKUP_DIR/backup_$DATE.dump"

# Retain only last 30 days
find $BACKUP_DIR -name "backup_*.dump" -mtime +30 -delete
```

### Restore

```bash
pg_restore -U postgres -d ap_command_centre -c backup_20241027_120000.dump
```

## Security Considerations

### 1. Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policy for multi-tenancy
CREATE POLICY company_isolation ON invoices
  USING (company_id = current_setting('app.current_company_id')::uuid);

-- Set company context
SET app.current_company_id = '123e4567-e89b-12d3-a456-426614174000';
```

### 2. Encryption

```sql
-- Install pgcrypto extension
CREATE EXTENSION pgcrypto;

-- Encrypt sensitive data
UPDATE vendors
SET bank_account_number = pgp_sym_encrypt(bank_account_number, 'encryption_key');

-- Decrypt
SELECT pgp_sym_decrypt(bank_account_number::bytea, 'encryption_key')
FROM vendors;
```

### 3. Audit Triggers

```sql
-- Create audit function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    company_id,
    entity_type,
    entity_id,
    action,
    changes,
    created_at
  ) VALUES (
    NEW.company_id,
    TG_TABLE_NAME,
    NEW.id,
    TG_OP,
    row_to_json(NEW),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER invoice_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

## Migration Checklist

- [ ] PostgreSQL 14+ installed
- [ ] Database created
- [ ] Environment variables configured
- [ ] Prisma dependencies installed
- [ ] Schema migration applied
- [ ] Indexes created
- [ ] Seed data loaded
- [ ] Backup strategy configured
- [ ] RLS policies applied
- [ ] Audit triggers configured
- [ ] Performance baseline established
- [ ] Monitoring configured

## Monitoring

### Key Metrics

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('ap_command_centre'));

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'ap_command_centre';

-- Slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   ```
   Error: connect ETIMEDOUT
   Solution: Check firewall, PostgreSQL config (postgresql.conf)
   ```

2. **Migration Failed**
   ```
   Error: relation already exists
   Solution: Reset database and reapply migrations
   npx prisma migrate reset
   ```

3. **Slow Queries**
   ```
   Solution: Add missing indexes, analyze query plan
   EXPLAIN ANALYZE <query>
   ```

4. **Disk Space**
   ```
   Solution: Archive old data, vacuum tables
   VACUUM FULL invoices;
   ```
