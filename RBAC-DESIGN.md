# AP Command Centre - RBAC System Design

## Table of Contents
1. [Roles](#1-roles)
2. [Permissions](#2-permissions)
3. [Screen Access Matrix](#3-screen-access-matrix)
4. [API Authorization Matrix](#4-api-authorization-matrix)
5. [Route Guards](#5-route-guards)

---

## 1. Roles

### 1.1 System Roles

#### Super Admin
**Purpose**: System-wide administration and company management

**Characteristics**:
- Can manage multiple companies
- Full access to all system features
- Can create/modify/delete companies
- Can manage system-level configurations
- Cannot be deleted or modified by regular admins
- Bypass all company-level restrictions

**Typical Users**: System administrators, IT staff

---

#### Company Admin
**Purpose**: Full control within a single company

**Characteristics**:
- Complete access to all company resources
- Can manage users, roles, and permissions
- Can configure company settings
- Can view/export all reports
- Can perform all invoice and payment operations
- Access to audit logs and system health

**Typical Users**: CFO, Controller, AP Manager

---

#### AP Manager
**Purpose**: Manage AP operations and supervise AP team

**Characteristics**:
- Full CRUD on invoices and payments
- Can approve invoices at any level
- Can manage vendors
- Can assign invoices to team members
- Can view team performance metrics
- Can configure approval workflows
- Cannot manage users or system settings

**Typical Users**: Accounts Payable Manager, AP Supervisor

---

#### AP Clerk
**Purpose**: Daily AP processing and data entry

**Characteristics**:
- Create and edit draft invoices
- Cannot approve invoices
- Can submit invoices for approval
- Can create payment batches (requires approval)
- Can manage vendor information
- Can add attachments and comments
- Cannot delete approved invoices
- Cannot modify payments after submission

**Typical Users**: AP Specialist, AP Clerk, Junior Accountant

---

#### Approver (Level 1)
**Purpose**: First-level invoice approval

**Characteristics**:
- View assigned invoices pending approval
- Approve/reject invoices up to $10,000
- Cannot create or edit invoices
- Can add approval comments
- Can view vendor information (read-only)
- Can view departmental reports
- Cannot approve own submissions

**Typical Users**: Department Managers, Team Leads

**Approval Limits**:
- Single invoice: $0 - $10,000
- Cannot approve beyond limit

---

#### Approver (Level 2)
**Purpose**: Second-level invoice approval

**Characteristics**:
- View assigned invoices pending approval
- Approve/reject invoices up to $50,000
- All Level 1 permissions
- Can view cross-departmental reports
- Can escalate invoices
- Cannot approve own submissions

**Typical Users**: Senior Managers, Directors

**Approval Limits**:
- Single invoice: $10,001 - $50,000
- Requires Level 1 approval first

---

#### Approver (Level 3)
**Purpose**: Executive-level approval for high-value invoices

**Characteristics**:
- View all invoices pending approval
- Approve/reject invoices over $50,000
- All Level 2 permissions
- Can override approval workflows (with audit)
- Can view executive dashboards
- Cannot approve own submissions

**Typical Users**: VP Finance, CFO, CEO

**Approval Limits**:
- Single invoice: $50,001+
- Requires Level 1 and Level 2 approval first

---

#### Accountant
**Purpose**: Financial reporting and reconciliation

**Characteristics**:
- Read-only access to all invoices and payments
- Can view and export financial reports
- Can view GL account details
- Can run reconciliation reports
- Can view audit logs
- Cannot create or modify transactions
- Can add internal comments

**Typical Users**: Staff Accountant, Financial Analyst

---

#### Auditor
**Purpose**: Compliance review and audit trail access

**Characteristics**:
- Read-only access to all data
- Full access to audit logs
- Can export all reports
- Can view deleted/archived records
- Cannot modify any data
- Can view all comments (including internal)
- Time-limited access (configurable)

**Typical Users**: Internal Auditor, External Auditor, Compliance Officer

---

#### Viewer
**Purpose**: Read-only access for stakeholders

**Characteristics**:
- View invoices (limited fields)
- View basic vendor information
- View summary reports only
- Cannot view sensitive data (bank details, attachments)
- Cannot export data
- Cannot view audit logs
- Cannot add comments

**Typical Users**: Department staff, consultants, stakeholders

---

### 1.2 Role Hierarchy

```
Super Admin (System Level)
    │
    └── Company Admin (Company Level)
            │
            ├── AP Manager
            │       ├── AP Clerk
            │       └── Accountant
            │
            ├── Approver (Level 3)
            │       └── Approver (Level 2)
            │               └── Approver (Level 1)
            │
            ├── Auditor
            │
            └── Viewer
```

---

## 2. Permissions

### 2.1 Permission Structure

Permissions follow the format: `resource:action[:scope]`

**Resources**:
- `invoices`
- `payments`
- `vendors`
- `users`
- `roles`
- `departments`
- `gl_accounts`
- `reports`
- `audit_logs`
- `company`
- `approvals`
- `attachments`
- `comments`

**Actions**:
- `create` - Create new records
- `read` - View records
- `update` - Modify existing records
- `delete` - Delete records
- `approve` - Approve invoices/payments
- `reject` - Reject invoices/payments
- `export` - Export data
- `import` - Import data

**Scopes** (optional):
- `own` - Own records only
- `department` - Department records only
- `all` - All company records
- `system` - System-wide (Super Admin only)

### 2.2 Permission Matrix by Role

| Permission | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|------------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| **Invoices** |
| invoices:create:all | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| invoices:read:all | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| invoices:read:department | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| invoices:read:own | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| invoices:update:all | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| invoices:update:own | ✓ | ✓ | ✓ | ✓* | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| invoices:delete:all | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| invoices:approve:level1 | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| invoices:approve:level2 | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ |
| invoices:approve:level3 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| invoices:reject:all | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| invoices:export:all | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| invoices:import:all | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Payments** |
| payments:create:all | ✓ | ✓ | ✓ | ✓** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| payments:read:all | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| payments:update:all | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| payments:update:own | ✓ | ✓ | ✓ | ✓** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| payments:delete:all | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| payments:approve:all | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| payments:export:all | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| **Vendors** |
| vendors:create:all | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| vendors:read:all | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| vendors:update:all | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| vendors:delete:all | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| vendors:export:all | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| **Users** |
| users:create:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| users:read:all | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| users:update:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| users:update:own | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| users:delete:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Roles** |
| roles:create:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| roles:read:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| roles:update:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| roles:delete:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Departments** |
| departments:create:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| departments:read:all | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| departments:update:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| departments:delete:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **GL Accounts** |
| gl_accounts:create:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| gl_accounts:read:all | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| gl_accounts:update:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| gl_accounts:delete:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Reports** |
| reports:read:all | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| reports:read:department | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| reports:export:all | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| **Audit Logs** |
| audit_logs:read:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| audit_logs:export:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| **Company** |
| company:read:all | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| company:update:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| company:settings:all | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Approvals** |
| approvals:read:all | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| approvals:read:own | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Attachments** |
| attachments:create:all | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| attachments:read:all | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| attachments:delete:all | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| attachments:delete:own | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Comments** |
| comments:create:all | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| comments:read:all | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| comments:update:own | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| comments:delete:own | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Notes**:
- `*` AP Clerk can only update draft invoices they created
- `**` AP Clerk can create/update draft payments only (requires approval)
- ✓ = Has permission
- ✗ = No permission

### 2.3 Conditional Permissions

#### Status-Based Permissions

| Action | Status Allowed | Roles |
|--------|---------------|-------|
| Update Invoice | draft | AP Clerk, AP Manager, Company Admin |
| Update Invoice | pending_approval | AP Manager, Company Admin |
| Update Invoice | approved, paid | Company Admin only |
| Delete Invoice | draft | AP Manager, Company Admin |
| Delete Invoice | other | Company Admin only |
| Approve Invoice | pending_approval | Approvers (based on level) |

#### Amount-Based Permissions

| Invoice Amount | Required Approval Levels | Roles |
|---------------|-------------------------|-------|
| $0 - $10,000 | Level 1 | Approver L1+ |
| $10,001 - $50,000 | Level 1 + Level 2 | Approver L2+ |
| $50,001+ | Level 1 + Level 2 + Level 3 | Approver L3 |

#### Time-Based Permissions

| Permission | Time Restriction | Roles |
|-----------|-----------------|-------|
| Edit Invoice | Within 24 hours of creation | AP Clerk |
| Delete Payment | Within 1 hour of creation | AP Manager |
| Approve Invoice | Only during business hours | Configurable per company |
| Access System | Auditor access expires after 90 days | Auditor |

#### Ownership-Based Permissions

| Resource | Ownership Rule | Roles |
|---------|---------------|-------|
| Invoice | Created by user | AP Clerk (update only) |
| Payment | Created by user | AP Clerk (update draft only) |
| Comment | Created by user | All (update/delete own) |
| Attachment | Uploaded by user | All (delete own) |

### 2.4 Permission Inheritance

Roles can inherit permissions from parent roles:

```
Company Admin inherits from:
  - AP Manager
  - Accountant
  - Auditor

AP Manager inherits from:
  - AP Clerk
  - Approver (All Levels)

Approver L3 inherits from:
  - Approver L2
  
Approver L2 inherits from:
  - Approver L1
```

---

## 3. Screen Access Matrix

### 3.1 Main Navigation

| Screen | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|--------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Invoices | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Payments | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Vendors | ✓ | ✓ | ✓ | ✓ | ✓* | ✓* | ✓* | ✓ | ✓ | ✓* |
| Reports | ✓ | ✓ | ✓ | ✓ | ✓** | ✓** | ✓** | ✓ | ✓ | ✓** |
| Users | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Settings | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Audit Logs | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |

**Notes**:
- `*` Read-only access
- `**` Limited to department-level reports

### 3.2 Dashboard Components

| Component | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|-----------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| Total Invoices (All) | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Total Invoices (Dept) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Pending Approvals | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| My Pending Approvals | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Payment Schedule | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Cash Flow Forecast | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Overdue Invoices | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Top Vendors | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Recent Activity | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| System Health | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

### 3.3 Invoice Screens

| Screen/Action | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|---------------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| Invoice List | ✓ | ✓ | ✓ | ✓ | ✓* | ✓* | ✓* | ✓ | ✓ | ✓* |
| Create Invoice | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View Invoice Details | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓** |
| Edit Invoice (Draft) | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Edit Invoice (Other) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Delete Invoice | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Submit for Approval | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Approve/Reject | ✓ | ✓ | ✓ | ✗ | ✓*** | ✓*** | ✓*** | ✗ | ✗ | ✗ |
| Add Line Items | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Upload Attachments | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View Attachments | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Add Comments | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| View Comments | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| View Approval History | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Export Invoices | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Import Invoices | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Notes**:
- `*` Only invoices assigned for approval or department-level
- `**` Limited fields visible (no bank details, sensitive data)
- `***` Based on approval level and amount

### 3.4 Payment Screens

| Screen/Action | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|---------------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| Payment List | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Create Payment | ✓ | ✓ | ✓ | ✓* | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View Payment Details | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Edit Payment (Draft) | ✓ | ✓ | ✓ | ✓* | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Delete Payment | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Approve Payment | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Process Payment | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Void Payment | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Export Payments | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Generate Payment File | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Notes**:
- `*` Draft only, requires approval

### 3.5 Vendor Screens

| Screen/Action | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|---------------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| Vendor List | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Vendor | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View Vendor Details | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* |
| Edit Vendor | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Delete Vendor | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage Contacts | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View Bank Details | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Edit Bank Details | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View Vendor History | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Export Vendors | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Import Vendors | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Notes**:
- `*` Limited fields (no bank details)

### 3.6 Report Screens

| Report | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|--------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| AP Aging Report | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Invoice Summary | ✓ | ✓ | ✓ | ✓ | ✓* | ✓* | ✓* | ✓ | ✓ | ✓* |
| Payment Summary | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Vendor Spend Analysis | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Cash Flow Report | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| GL Distribution | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Approval Metrics | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| User Activity Report | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Exception Report | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Department Report | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Notes**:
- `*` Department-level only

### 3.7 Settings Screens

| Screen | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|--------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| Company Settings | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| User Management | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Role Management | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Department Management | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| GL Account Management | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Approval Workflows | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Payment Settings | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Email Templates | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Integration Settings | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| My Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| My Preferences | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 4. API Authorization Matrix

### 4.1 Invoice Endpoints

| Endpoint | Method | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|----------|--------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| `/api/invoices` | GET | ✓ | ✓ | ✓ | ✓ | ✓* | ✓* | ✓* | ✓ | ✓ | ✓** |
| `/api/invoices/:id` | GET | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓** |
| `/api/invoices` | POST | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/invoices/:id` | PUT | ✓ | ✓ | ✓ | ✓*** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/invoices/:id` | PATCH | ✓ | ✓ | ✓ | ✓*** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/invoices/:id` | DELETE | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/invoices/:id/submit` | POST | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/invoices/:id/approve` | POST | ✓ | ✓ | ✓ | ✗ | ✓**** | ✓**** | ✓**** | ✗ | ✗ | ✗ |
| `/api/invoices/:id/reject` | POST | ✓ | ✓ | ✓ | ✗ | ✓**** | ✓**** | ✓**** | ✗ | ✗ | ✗ |
| `/api/invoices/:id/cancel` | POST | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/invoices/:id/line-items` | GET | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓** |
| `/api/invoices/:id/line-items` | POST | ✓ | ✓ | ✓ | ✓*** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/invoices/:id/line-items/:lineId` | PUT | ✓ | ✓ | ✓ | ✓*** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/invoices/:id/line-items/:lineId` | DELETE | ✓ | ✓ | ✓ | ✓*** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/invoices/export` | GET | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `/api/invoices/import` | POST | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Notes**:
- `*` Filtered by assigned approvals or department
- `**` Limited fields returned
- `***` Only draft invoices created by user
- `****` Based on approval level and amount

### 4.2 Payment Endpoints

| Endpoint | Method | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|----------|--------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| `/api/payments` | GET | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `/api/payments/:id` | GET | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `/api/payments` | POST | ✓ | ✓ | ✓ | ✓* | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/payments/:id` | PUT | ✓ | ✓ | ✓ | ✓* | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/payments/:id` | DELETE | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/payments/:id/approve` | POST | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/payments/:id/process` | POST | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/payments/:id/void` | POST | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/payments/export` | GET | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |

**Notes**:
- `*` Draft only

### 4.3 Vendor Endpoints

| Endpoint | Method | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|----------|--------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| `/api/vendors` | GET | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/api/vendors/:id` | GET | ✓ | ✓ | ✓ | ✓ | ✓* | ✓* | ✓* | ✓ | ✓ | ✓* |
| `/api/vendors` | POST | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/vendors/:id` | PUT | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/vendors/:id` | DELETE | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/vendors/:id/contacts` | GET | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/api/vendors/:id/contacts` | POST | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/vendors/:id/contacts/:contactId` | PUT | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/vendors/:id/contacts/:contactId` | DELETE | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/vendors/export` | GET | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `/api/vendors/import` | POST | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Notes**:
- `*` Bank details excluded

### 4.4 User & Role Endpoints

| Endpoint | Method | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|----------|--------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| `/api/users` | GET | ✓ | ✓ | ✓** | ✓** | ✓** | ✓** | ✓** | ✓** | ✓** | ✗ |
| `/api/users/:id` | GET | ✓ | ✓ | ✓** | ✓** | ✓** | ✓** | ✓** | ✓** | ✓** | ✗ |
| `/api/users` | POST | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/users/:id` | PUT | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/users/:id` | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/users/me` | GET | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/api/users/me` | PUT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/api/roles` | GET | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/roles/:id` | GET | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/roles` | POST | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/roles/:id` | PUT | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/roles/:id` | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Notes**:
- `**` Limited fields (no sensitive data)

### 4.5 Report Endpoints

| Endpoint | Method | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|----------|--------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| `/api/reports/ap-aging` | GET | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `/api/reports/invoice-summary` | GET | ✓ | ✓ | ✓ | ✓ | ✓* | ✓* | ✓* | ✓ | ✓ | ✓* |
| `/api/reports/payment-summary` | GET | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `/api/reports/vendor-spend` | GET | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `/api/reports/cash-flow` | GET | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `/api/reports/gl-distribution` | GET | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `/api/reports/approval-metrics` | GET | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `/api/reports/user-activity` | GET | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `/api/reports/department` | GET | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Notes**:
- `*` Department-level only

### 4.6 Audit Log Endpoints

| Endpoint | Method | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|----------|--------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| `/api/audit-logs` | GET | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `/api/audit-logs/:id` | GET | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `/api/audit-logs/export` | GET | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |

### 4.7 Attachment Endpoints

| Endpoint | Method | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|----------|--------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| `/api/attachments` | POST | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/attachments/:id` | GET | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| `/api/attachments/:id` | DELETE | ✓ | ✓ | ✓ | ✓* | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Notes**:
- `*` Own uploads only

### 4.8 Comment Endpoints

| Endpoint | Method | Super Admin | Company Admin | AP Manager | AP Clerk | Approver L1 | Approver L2 | Approver L3 | Accountant | Auditor | Viewer |
|----------|--------|-------------|---------------|------------|----------|-------------|-------------|-------------|------------|---------|--------|
| `/api/comments` | GET | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| `/api/comments` | POST | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `/api/comments/:id` | PUT | ✓ | ✓ | ✓ | ✓* | ✓* | ✓* | ✓* | ✓* | ✗ | ✗ |
| `/api/comments/:id` | DELETE | ✓ | ✓ | ✓ | ✓* | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Notes**:
- `*` Own comments only

---

## 5. Route Guards

### 5.1 Guard Types

#### AuthGuard
**Purpose**: Ensure user is authenticated

**Logic**:
```
1. Check if JWT token exists in request header
2. Validate token signature and expiration
3. Extract user ID from token
4. Fetch user from database
5. Check if user is active
6. Attach user object to request
7. Allow or deny access
```

**Applied To**: All protected routes

---

#### RoleGuard
**Purpose**: Check if user has required role(s)

**Logic**:
```
1. Assume AuthGuard has run (user in request)
2. Extract required roles from route metadata
3. Fetch user's roles from database
4. Check if user has at least one required role
5. Allow or deny access
```

**Configuration**:
```
@Roles('company_admin', 'ap_manager')
```

---

#### PermissionGuard
**Purpose**: Check if user has specific permission(s)

**Logic**:
```
1. Assume AuthGuard has run (user in request)
2. Extract required permissions from route metadata
3. Fetch user's roles with permissions
4. Build complete permission set (with inheritance)
5. Check if user has all required permissions
6. Apply scope filtering if specified
7. Allow or deny access
```

**Configuration**:
```
@RequirePermissions('invoices:create:all')
@RequirePermissions('invoices:approve:level1', 'invoices:approve:level2')
```

---

#### OwnershipGuard
**Purpose**: Check if user owns or has access to resource

**Logic**:
```
1. Assume AuthGuard has run (user in request)
2. Extract resource ID from route params
3. Fetch resource from database
4. Check ownership rules:
   - Is user the creator?
   - Is user in same department?
   - Is user an assigned approver?
   - Does user have company-wide access?
5. Allow or deny access
```

**Applied To**: Update/Delete operations with `:own` scope

---

#### StatusGuard
**Purpose**: Check if resource is in valid status for operation

**Logic**:
```
1. Extract resource ID from route params
2. Fetch resource from database
3. Extract allowed statuses from route metadata
4. Check if resource status is in allowed list
5. Allow or deny access
```

**Configuration**:
```
@AllowedStatuses('draft', 'pending_approval')
```

---

#### AmountGuard
**Purpose**: Check if user can approve based on invoice amount

**Logic**:
```
1. Assume AuthGuard has run (user in request)
2. Extract invoice ID from route params
3. Fetch invoice and total amount
4. Fetch user's approval limits
5. Check if amount is within user's approval limit
6. Check if previous approval levels completed
7. Allow or deny access
```

**Applied To**: Invoice approval endpoints

---

#### CompanyGuard
**Purpose**: Ensure multi-tenant isolation

**Logic**:
```
1. Assume AuthGuard has run (user in request)
2. Extract resource ID from route params (if applicable)
3. Fetch resource from database
4. Check if resource belongs to user's company
5. For Super Admin, bypass check
6. Allow or deny access
```

**Applied To**: All company-scoped routes

---

#### RateLimitGuard
**Purpose**: Prevent abuse and DOS attacks

**Logic**:
```
1. Extract user ID or IP address
2. Get current request count from cache
3. Check if limit exceeded
4. Increment counter
5. Set expiration if new
6. Allow or deny access
```

**Configuration**:
```
@RateLimit(100, '15m') // 100 requests per 15 minutes
```

---

### 5.2 Guard Application by Route

| Route | Auth | Role | Permission | Ownership | Status | Amount | Company | RateLimit |
|-------|------|------|------------|-----------|--------|--------|---------|-----------|
| `/api/auth/login` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| `/api/auth/logout` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `/api/auth/refresh` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Invoices** |
| `GET /api/invoices` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `GET /api/invoices/:id` | ✓ | ✗ | ✓ | ✓* | ✗ | ✗ | ✓ | ✗ |
| `POST /api/invoices` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| `PUT /api/invoices/:id` | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| `DELETE /api/invoices/:id` | ✓ | ✗ | ✓ | ✗ | ✓** | ✗ | ✓ | ✓ |
| `POST /api/invoices/:id/approve` | ✓ | ✗ | ✓ | ✓*** | ✓**** | ✓ | ✓ | ✓ |
| **Payments** |
| `GET /api/payments` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `POST /api/payments` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| `PUT /api/payments/:id` | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| `POST /api/payments/:id/approve` | ✓ | ✓***** | ✗ | ✗ | ✓****** | ✗ | ✓ | ✓ |
| **Vendors** |
| `GET /api/vendors` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `POST /api/vendors` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| `PUT /api/vendors/:id` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Users & Roles** |
| `GET /api/users` | ✓ | ✓******* | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `POST /api/users` | ✓ | ✓******* | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| `PUT /api/users/:id` | ✓ | ✓******* | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ |
| **Reports** |
| `GET /api/reports/*` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Audit Logs** |
| `GET /api/audit-logs` | ✓ | ✓******** | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |

**Notes**:
- `*` For approvers, only assigned invoices
- `**` Only draft status allowed for non-managers
- `***` Cannot approve own submissions
- `****` Status must be pending_approval
- `*****` Company Admin, AP Manager only
- `******` Status must be draft
- `*******` Company Admin only
- `********` Company Admin, Auditor only

### 5.3 Guard Execution Order

```
1. RateLimitGuard (if configured)
2. AuthGuard (always on protected routes)
3. CompanyGuard (ensure tenant isolation)
4. RoleGuard (if role-based restriction)
5. PermissionGuard (if permission-based restriction)
6. StatusGuard (if status check required)
7. AmountGuard (if amount check required)
8. OwnershipGuard (if ownership check required)
9. Route Handler Execution
```

### 5.4 Guard Bypass Rules

**Super Admin Bypass**:
- CompanyGuard (can access all companies)
- AmountGuard (can approve any amount)

**Never Bypass**:
- AuthGuard (always required)
- RateLimitGuard (applies to all users)
- StatusGuard (enforces business rules)

### 5.5 Error Responses

| Guard | Error Code | HTTP Status | Message |
|-------|-----------|-------------|---------|
| AuthGuard | AUTH_001 | 401 | "Authentication required" |
| AuthGuard | AUTH_002 | 401 | "Invalid or expired token" |
| AuthGuard | AUTH_003 | 403 | "User account is inactive" |
| RoleGuard | RBAC_001 | 403 | "Insufficient role privileges" |
| PermissionGuard | RBAC_002 | 403 | "Permission denied: {permission}" |
| OwnershipGuard | RBAC_003 | 403 | "Access denied: resource ownership required" |
| StatusGuard | BUS_001 | 400 | "Invalid resource status for this operation" |
| AmountGuard | APPR_001 | 403 | "Amount exceeds approval limit" |
| AmountGuard | APPR_002 | 400 | "Previous approval level required" |
| CompanyGuard | TENANT_001 | 403 | "Access denied: resource belongs to different company" |
| RateLimitGuard | RATE_001 | 429 | "Too many requests. Try again later" |

---

## 6. RBAC Implementation Checklist

### 6.1 Database Setup
- [ ] Create roles table with permissions JSON field
- [ ] Create user_roles junction table
- [ ] Seed default system roles
- [ ] Create indexes on frequently queried fields

### 6.2 Authentication
- [ ] Implement JWT token generation
- [ ] Implement token refresh mechanism
- [ ] Implement password hashing (bcrypt)
- [ ] Implement login/logout endpoints
- [ ] Implement session management

### 6.3 Authorization
- [ ] Implement AuthGuard
- [ ] Implement RoleGuard
- [ ] Implement PermissionGuard
- [ ] Implement OwnershipGuard
- [ ] Implement StatusGuard
- [ ] Implement AmountGuard
- [ ] Implement CompanyGuard
- [ ] Implement RateLimitGuard

### 6.4 Permission Resolution
- [ ] Implement permission inheritance logic
- [ ] Implement scope filtering (own, department, all)
- [ ] Implement conditional permission checks
- [ ] Cache resolved permissions per user session

### 6.5 API Layer
- [ ] Apply guards to all protected routes
- [ ] Implement permission decorators
- [ ] Filter API responses based on user permissions
- [ ] Log all authorization failures

### 6.6 Frontend Integration
- [ ] Implement role-based navigation rendering
- [ ] Implement permission-based button visibility
- [ ] Implement field-level permissions (read-only)
- [ ] Handle 403 errors gracefully

### 6.7 Testing
- [ ] Unit tests for each guard
- [ ] Integration tests for guard combinations
- [ ] Test permission inheritance
- [ ] Test multi-tenant isolation
- [ ] Test approval workflows
- [ ] Load test rate limiting

### 6.8 Monitoring
- [ ] Log all permission denials
- [ ] Monitor failed login attempts
- [ ] Track approval metrics
- [ ] Alert on suspicious activity
- [ ] Audit trail for role/permission changes

---

## 7. Security Best Practices

### 7.1 Token Management
- Use short-lived access tokens (15 minutes)
- Use long-lived refresh tokens (7 days)
- Rotate refresh tokens on use
- Invalidate tokens on logout
- Store tokens securely (httpOnly cookies)

### 7.2 Password Policy
- Minimum 8 characters
- Require uppercase, lowercase, number, special character
- Password expiry (90 days)
- Prevent password reuse (last 5 passwords)
- Account lockout after 5 failed attempts

### 7.3 Approval Security
- Cannot approve own submissions
- Cannot skip approval levels
- Approval delegation requires audit log
- Time-limited approval sessions
- Re-authentication for high-value approvals

### 7.4 Multi-Tenancy
- Strict company isolation at database level
- Row-level security policies
- Company ID in all queries
- Validate company ID in all API calls
- Super Admin override requires audit log

### 7.5 Data Protection
- Encrypt sensitive data at rest
- Mask sensitive fields in logs
- Field-level encryption for bank details
- PII access logging
- Data retention policies
