# AP Command Centre - Database Design

## 1. ER Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Vendor    │────────<│   Invoice    │>────────│  LineItem   │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                         │
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌─────────────┐
                        │   Payment    │         │  GLAccount  │
                        └──────────────┘         └─────────────┘
                               │
                               │
                               ▼
                        ┌──────────────┐
                        │ PaymentItem  │
                        └──────────────┘

┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │────────<│  Approval    │>────────│   Invoice   │
└─────────────┘         └──────────────┘         └─────────────┘
      │
      │
      ▼
┌─────────────┐
│    Role     │
└─────────────┘

┌─────────────┐         ┌──────────────┐
│   Company   │────────<│   Vendor     │
└─────────────┘         └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ VendorContact│
                        └──────────────┘

┌─────────────┐         ┌──────────────┐
│ Department  │────────<│   Invoice    │
└─────────────┘         └──────────────┘

┌─────────────┐         ┌──────────────┐
│   Invoice   │────────<│  Attachment  │
└─────────────┘         └──────────────┘

┌─────────────┐         ┌──────────────┐
│   Invoice   │────────<│  AuditLog    │
└─────────────┘         └──────────────┘
      │
      └───────────────────────────────────┐
                                          ▼
                                   ┌──────────────┐
                                   │  Comment     │
                                   └──────────────┘
```

## 2. Tables Overview

1. **companies** - Multi-tenancy support
2. **users** - System users
3. **roles** - User roles (Admin, Approver, AP Clerk, Viewer)
4. **user_roles** - Many-to-many relationship
5. **vendors** - Supplier information
6. **vendor_contacts** - Vendor contact persons
7. **departments** - Organizational departments
8. **gl_accounts** - Chart of accounts
9. **invoices** - AP invoices
10. **invoice_line_items** - Invoice line details
11. **approvals** - Approval workflow
12. **payments** - Payment batches
13. **payment_items** - Individual payment transactions
14. **attachments** - Document storage references
15. **comments** - Invoice comments/notes
16. **audit_logs** - Complete audit trail

## 3. Tables with Columns

### companies
```sql
id                  UUID PRIMARY KEY
name                VARCHAR(255) NOT NULL
legal_name          VARCHAR(255)
tax_id              VARCHAR(50)
address_line1       VARCHAR(255)
address_line2       VARCHAR(255)
city                VARCHAR(100)
state               VARCHAR(100)
postal_code         VARCHAR(20)
country             VARCHAR(2)
currency            VARCHAR(3) DEFAULT 'USD'
fiscal_year_end     VARCHAR(5)
settings            JSONB
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

### users
```sql
id                  UUID PRIMARY KEY
company_id          UUID NOT NULL REFERENCES companies(id)
email               VARCHAR(255) NOT NULL UNIQUE
first_name          VARCHAR(100) NOT NULL
last_name           VARCHAR(100) NOT NULL
password_hash       VARCHAR(255) NOT NULL
phone               VARCHAR(20)
department_id       UUID REFERENCES departments(id)
is_active           BOOLEAN DEFAULT true
last_login_at       TIMESTAMP
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

### roles
```sql
id                  UUID PRIMARY KEY
company_id          UUID NOT NULL REFERENCES companies(id)
name                VARCHAR(100) NOT NULL
description         TEXT
permissions         JSONB NOT NULL
is_system_role      BOOLEAN DEFAULT false
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

UNIQUE(company_id, name)
```

### user_roles
```sql
id                  UUID PRIMARY KEY
user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
role_id             UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE
assigned_at         TIMESTAMP DEFAULT NOW()
assigned_by         UUID REFERENCES users(id)

UNIQUE(user_id, role_id)
```

### vendors
```sql
id                  UUID PRIMARY KEY
company_id          UUID NOT NULL REFERENCES companies(id)
vendor_code         VARCHAR(50) NOT NULL
name                VARCHAR(255) NOT NULL
legal_name          VARCHAR(255)
tax_id              VARCHAR(50)
payment_terms       VARCHAR(50)
payment_method      VARCHAR(50)
currency            VARCHAR(3) DEFAULT 'USD'
address_line1       VARCHAR(255)
address_line2       VARCHAR(255)
city                VARCHAR(100)
state               VARCHAR(100)
postal_code         VARCHAR(20)
country             VARCHAR(2)
phone               VARCHAR(20)
email               VARCHAR(255)
website             VARCHAR(255)
bank_name           VARCHAR(255)
bank_account_number VARCHAR(100)
bank_routing_number VARCHAR(50)
bank_swift_code     VARCHAR(20)
notes               TEXT
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

UNIQUE(company_id, vendor_code)
```

### vendor_contacts
```sql
id                  UUID PRIMARY KEY
vendor_id           UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE
first_name          VARCHAR(100) NOT NULL
last_name           VARCHAR(100) NOT NULL
email               VARCHAR(255)
phone               VARCHAR(20)
title               VARCHAR(100)
is_primary          BOOLEAN DEFAULT false
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

### departments
```sql
id                  UUID PRIMARY KEY
company_id          UUID NOT NULL REFERENCES companies(id)
code                VARCHAR(50) NOT NULL
name                VARCHAR(255) NOT NULL
parent_id           UUID REFERENCES departments(id)
manager_id          UUID REFERENCES users(id)
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

UNIQUE(company_id, code)
```

### gl_accounts
```sql
id                  UUID PRIMARY KEY
company_id          UUID NOT NULL REFERENCES companies(id)
account_number      VARCHAR(50) NOT NULL
account_name        VARCHAR(255) NOT NULL
account_type        VARCHAR(50) NOT NULL
parent_id           UUID REFERENCES gl_accounts(id)
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

UNIQUE(company_id, account_number)
```

### invoices
```sql
id                  UUID PRIMARY KEY
company_id          UUID NOT NULL REFERENCES companies(id)
invoice_number      VARCHAR(100) NOT NULL
vendor_id           UUID NOT NULL REFERENCES vendors(id)
department_id       UUID REFERENCES departments(id)
invoice_date        DATE NOT NULL
due_date            DATE NOT NULL
received_date       DATE DEFAULT CURRENT_DATE
payment_terms       VARCHAR(50)
currency            VARCHAR(3) DEFAULT 'USD'
exchange_rate       DECIMAL(12, 6) DEFAULT 1.0
subtotal            DECIMAL(15, 2) NOT NULL
tax_amount          DECIMAL(15, 2) DEFAULT 0
discount_amount     DECIMAL(15, 2) DEFAULT 0
total_amount        DECIMAL(15, 2) NOT NULL
amount_paid         DECIMAL(15, 2) DEFAULT 0
amount_due          DECIMAL(15, 2) NOT NULL
status              VARCHAR(50) NOT NULL DEFAULT 'draft'
approval_status     VARCHAR(50) DEFAULT 'pending'
payment_status      VARCHAR(50) DEFAULT 'unpaid'
description         TEXT
notes               TEXT
po_number           VARCHAR(100)
created_by          UUID REFERENCES users(id)
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

UNIQUE(company_id, invoice_number, vendor_id)
```

### invoice_line_items
```sql
id                  UUID PRIMARY KEY
invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE
line_number         INTEGER NOT NULL
description         TEXT NOT NULL
quantity            DECIMAL(12, 4) DEFAULT 1
unit_price          DECIMAL(15, 2) NOT NULL
amount              DECIMAL(15, 2) NOT NULL
gl_account_id       UUID REFERENCES gl_accounts(id)
department_id       UUID REFERENCES departments(id)
tax_code            VARCHAR(20)
tax_amount          DECIMAL(15, 2) DEFAULT 0
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

UNIQUE(invoice_id, line_number)
```

### approvals
```sql
id                  UUID PRIMARY KEY
invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE
approver_id         UUID NOT NULL REFERENCES users(id)
level               INTEGER NOT NULL
status              VARCHAR(50) NOT NULL DEFAULT 'pending'
approved_at         TIMESTAMP
comments            TEXT
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

UNIQUE(invoice_id, approver_id, level)
```

### payments
```sql
id                  UUID PRIMARY KEY
company_id          UUID NOT NULL REFERENCES companies(id)
payment_number      VARCHAR(100) NOT NULL
payment_date        DATE NOT NULL
payment_method      VARCHAR(50) NOT NULL
bank_account        VARCHAR(100)
reference_number    VARCHAR(100)
total_amount        DECIMAL(15, 2) NOT NULL
currency            VARCHAR(3) DEFAULT 'USD'
status              VARCHAR(50) NOT NULL DEFAULT 'draft'
notes               TEXT
created_by          UUID REFERENCES users(id)
approved_by         UUID REFERENCES users(id)
approved_at         TIMESTAMP
processed_at        TIMESTAMP
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

UNIQUE(company_id, payment_number)
```

### payment_items
```sql
id                  UUID PRIMARY KEY
payment_id          UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE
invoice_id          UUID NOT NULL REFERENCES invoices(id)
amount              DECIMAL(15, 2) NOT NULL
discount_taken      DECIMAL(15, 2) DEFAULT 0
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

UNIQUE(payment_id, invoice_id)
```

### attachments
```sql
id                  UUID PRIMARY KEY
invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE
file_name           VARCHAR(255) NOT NULL
file_path           VARCHAR(500) NOT NULL
file_size           BIGINT NOT NULL
file_type           VARCHAR(100)
uploaded_by         UUID REFERENCES users(id)
uploaded_at         TIMESTAMP DEFAULT NOW()
```

### comments
```sql
id                  UUID PRIMARY KEY
invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE
user_id             UUID NOT NULL REFERENCES users(id)
content             TEXT NOT NULL
is_internal         BOOLEAN DEFAULT true
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

### audit_logs
```sql
id                  UUID PRIMARY KEY
company_id          UUID NOT NULL REFERENCES companies(id)
entity_type         VARCHAR(100) NOT NULL
entity_id           UUID NOT NULL
action              VARCHAR(50) NOT NULL
user_id             UUID REFERENCES users(id)
changes             JSONB
ip_address          VARCHAR(45)
user_agent          VARCHAR(255)
created_at          TIMESTAMP DEFAULT NOW()
```

## 4. Relationships

1. **Company → Users** (1:N)
   - One company has many users

2. **Company → Vendors** (1:N)
   - One company has many vendors

3. **Company → Departments** (1:N)
   - One company has many departments

4. **Company → GL Accounts** (1:N)
   - One company has many GL accounts

5. **Company → Invoices** (1:N)
   - One company has many invoices

6. **User ↔ Roles** (N:M via user_roles)
   - Many users can have many roles

7. **Vendor → Invoices** (1:N)
   - One vendor has many invoices

8. **Vendor → Vendor Contacts** (1:N)
   - One vendor has many contacts

9. **Invoice → Line Items** (1:N)
   - One invoice has many line items

10. **Invoice → Approvals** (1:N)
    - One invoice has many approvals (workflow)

11. **Invoice → Attachments** (1:N)
    - One invoice has many attachments

12. **Invoice → Comments** (1:N)
    - One invoice has many comments

13. **Invoice → Payment Items** (1:N)
    - One invoice can be in multiple payment batches (partial payments)

14. **Payment → Payment Items** (1:N)
    - One payment has many payment items

15. **GL Account → Line Items** (1:N)
    - One GL account used in many line items

16. **Department → Invoices** (1:N)
    - One department has many invoices

17. **Department → Line Items** (1:N)
    - One department has many line items

## 5. Indexes

### companies
```sql
CREATE INDEX idx_companies_is_active ON companies(is_active);
```

### users
```sql
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_department_id ON users(department_id);
```

### roles
```sql
CREATE INDEX idx_roles_company_id ON roles(company_id);
```

### user_roles
```sql
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
```

### vendors
```sql
CREATE INDEX idx_vendors_company_id ON vendors(company_id);
CREATE INDEX idx_vendors_vendor_code ON vendors(company_id, vendor_code);
CREATE INDEX idx_vendors_name ON vendors(name);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);
```

### vendor_contacts
```sql
CREATE INDEX idx_vendor_contacts_vendor_id ON vendor_contacts(vendor_id);
CREATE INDEX idx_vendor_contacts_is_primary ON vendor_contacts(vendor_id, is_primary);
```

### departments
```sql
CREATE INDEX idx_departments_company_id ON departments(company_id);
CREATE INDEX idx_departments_parent_id ON departments(parent_id);
CREATE INDEX idx_departments_code ON departments(company_id, code);
```

### gl_accounts
```sql
CREATE INDEX idx_gl_accounts_company_id ON gl_accounts(company_id);
CREATE INDEX idx_gl_accounts_number ON gl_accounts(company_id, account_number);
CREATE INDEX idx_gl_accounts_parent_id ON gl_accounts(parent_id);
CREATE INDEX idx_gl_accounts_type ON gl_accounts(account_type);
```

### invoices
```sql
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX idx_invoices_department_id ON invoices(department_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(company_id, invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_approval_status ON invoices(approval_status);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);
CREATE INDEX idx_invoices_po_number ON invoices(po_number);
```

### invoice_line_items
```sql
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_gl_account_id ON invoice_line_items(gl_account_id);
CREATE INDEX idx_invoice_line_items_department_id ON invoice_line_items(department_id);
```

### approvals
```sql
CREATE INDEX idx_approvals_invoice_id ON approvals(invoice_id);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_level ON approvals(level);
```

### payments
```sql
CREATE INDEX idx_payments_company_id ON payments(company_id);
CREATE INDEX idx_payments_payment_number ON payments(company_id, payment_number);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_by ON payments(created_by);
```

### payment_items
```sql
CREATE INDEX idx_payment_items_payment_id ON payment_items(payment_id);
CREATE INDEX idx_payment_items_invoice_id ON payment_items(invoice_id);
```

### attachments
```sql
CREATE INDEX idx_attachments_invoice_id ON attachments(invoice_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);
```

### comments
```sql
CREATE INDEX idx_comments_invoice_id ON comments(invoice_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
```

### audit_logs
```sql
CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## 6. Enums and Constants

### Invoice Status
- `draft` - Initial state
- `pending_approval` - Submitted for approval
- `approved` - Approved for payment
- `rejected` - Rejected by approver
- `paid` - Fully paid
- `partially_paid` - Partially paid
- `cancelled` - Cancelled
- `on_hold` - Temporarily on hold

### Approval Status
- `pending` - Awaiting approval
- `approved` - Approved
- `rejected` - Rejected

### Payment Status
- `unpaid` - Not paid
- `partially_paid` - Partially paid
- `paid` - Fully paid
- `overdue` - Past due date

### Payment Method
- `check` - Paper check
- `ach` - ACH/Bank transfer
- `wire` - Wire transfer
- `credit_card` - Credit card
- `eft` - Electronic funds transfer
- `other` - Other method

### Account Types
- `asset` - Asset account
- `liability` - Liability account
- `equity` - Equity account
- `revenue` - Revenue account
- `expense` - Expense account

### Audit Actions
- `created` - Record created
- `updated` - Record updated
- `deleted` - Record deleted
- `approved` - Record approved
- `rejected` - Record rejected
- `paid` - Payment made
