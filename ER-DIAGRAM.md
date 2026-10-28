# AP Command Centre - Entity Relationship Diagram

## Visual ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CORE ENTITIES                                      │
└─────────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────┐
                            │   Company    │
                            │──────────────│
                            │ id (PK)      │
                            │ name         │
                            │ currency     │
                            │ settings     │
                            └──────┬───────┘
                                   │
                     ┌─────────────┼─────────────┐
                     │             │             │
                     ▼             ▼             ▼
            ┌────────────┐  ┌────────────┐  ┌────────────┐
            │   User     │  │  Vendor    │  │ Department │
            │────────────│  │────────────│  │────────────│
            │ id (PK)    │  │ id (PK)    │  │ id (PK)    │
            │ companyId  │  │ companyId  │  │ companyId  │
            │ email      │  │ vendorCode │  │ code       │
            │ firstName  │  │ name       │  │ name       │
            │ lastName   │  │ taxId      │  │ parentId   │
            └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
                  │               │               │
                  │               │               │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INVOICE WORKFLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────┐
                            │   Invoice    │
                            │──────────────│
                            │ id (PK)      │
                            │ companyId    │
                     ┌──────│ vendorId     │──────┐
                     │      │ departmentId │      │
                     │      │ invoiceNumber│      │
                     │      │ totalAmount  │      │
                     │      │ status       │      │
                     │      │ paymentStatus│      │
                     │      └──────┬───────┘      │
                     │             │              │
                     │             │              │
       ┌─────────────▼──┐    ┌────▼──────────┐   └─────────────┐
       │ InvoiceLineItem│    │   Approval    │                 │
       │────────────────│    │───────────────│                 │
       │ id (PK)        │    │ id (PK)       │                 │
       │ invoiceId      │    │ invoiceId     │                 │
       │ lineNumber     │    │ approverId    │                 │
       │ description    │    │ level         │                 │
       │ amount         │    │ status        │                 │
       │ glAccountId    │    │ approvedAt    │                 │
       │ departmentId   │    └───────────────┘                 │
       └────────┬───────┘                                      │
                │                                              │
                ▼                                              │
       ┌────────────────┐                                     │
       │   GLAccount    │                                     │
       │────────────────│                                     │
       │ id (PK)        │                                     │
       │ companyId      │                                     │
       │ accountNumber  │                                     │
       │ accountName    │                                     │
       │ accountType    │                                     │
       └────────────────┘                                     │
                                                              │
┌─────────────────────────────────────────────────────────────▼───────────────┐
│                         PAYMENT PROCESSING                                    │
└─────────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────┐
                            │   Payment    │
                            │──────────────│
                            │ id (PK)      │
                            │ companyId    │
                            │ paymentNumber│
                            │ paymentDate  │
                            │ totalAmount  │
                            │ status       │
                            └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │ PaymentItem  │
                            │──────────────│
                            │ id (PK)      │
                            │ paymentId    │
                            │ invoiceId    │◄─────────┐
                            │ amount       │          │
                            └──────────────┘          │
                                                      │
                                          ┌───────────┘
                                          │
┌─────────────────────────────────────────▼───────────────────────────────────┐
│                    SUPPORTING ENTITIES                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────┐        ┌────────────────┐        ┌────────────────┐
│  Attachment    │        │    Comment     │        │   AuditLog     │
│────────────────│        │────────────────│        │────────────────│
│ id (PK)        │        │ id (PK)        │        │ id (PK)        │
│ invoiceId      │        │ invoiceId      │        │ companyId      │
│ fileName       │        │ userId         │        │ entityType     │
│ filePath       │        │ content        │        │ entityId       │
│ fileSize       │        │ isInternal     │        │ action         │
│ uploadedBy     │        └────────────────┘        │ userId         │
└────────────────┘                                  │ changes        │
                                                    └────────────────┘

┌────────────────┐        ┌────────────────┐        ┌────────────────┐
│ VendorContact  │        │     Role       │        │   UserRole     │
│────────────────│        │────────────────│        │────────────────│
│ id (PK)        │        │ id (PK)        │        │ id (PK)        │
│ vendorId       │        │ companyId      │        │ userId         │
│ firstName      │        │ name           │        │ roleId         │
│ lastName       │        │ description    │        │ assignedAt     │
│ email          │        │ permissions    │        └────────────────┘
│ isPrimary      │        └────────────────┘
└────────────────┘
```

## Detailed Relationships

### 1:N Relationships

| Parent Entity | Child Entity | Foreign Key | Description |
|--------------|--------------|-------------|-------------|
| Company | User | companyId | Multi-tenant user management |
| Company | Vendor | companyId | Multi-tenant vendor management |
| Company | Department | companyId | Organizational structure |
| Company | GLAccount | companyId | Chart of accounts |
| Company | Invoice | companyId | Invoice tracking |
| Company | Payment | companyId | Payment processing |
| Company | Role | companyId | Role-based access control |
| Company | AuditLog | companyId | Audit trail |
| User | Invoice | createdBy | Invoice creation tracking |
| User | Payment | createdBy | Payment creation tracking |
| User | Payment | approvedBy | Payment approval tracking |
| User | Approval | approverId | Approval workflow |
| User | Attachment | uploadedBy | Document upload tracking |
| User | Comment | userId | Comment authorship |
| Vendor | Invoice | vendorId | Vendor invoices |
| Vendor | VendorContact | vendorId | Contact management |
| Department | User | departmentId | User department assignment |
| Department | Invoice | departmentId | Invoice department tracking |
| Department | InvoiceLineItem | departmentId | Cost center allocation |
| Department | Department | parentId | Department hierarchy |
| GLAccount | InvoiceLineItem | glAccountId | Accounting coding |
| GLAccount | GLAccount | parentId | Account hierarchy |
| Invoice | InvoiceLineItem | invoiceId | Line item details |
| Invoice | Approval | invoiceId | Approval workflow |
| Invoice | PaymentItem | invoiceId | Payment allocation |
| Invoice | Attachment | invoiceId | Supporting documents |
| Invoice | Comment | invoiceId | Invoice discussions |
| Payment | PaymentItem | paymentId | Payment batch items |
| Role | UserRole | roleId | Role assignments |
| User | UserRole | userId | User role memberships |

### M:N Relationships

| Entity 1 | Entity 2 | Junction Table | Description |
|----------|----------|----------------|-------------|
| User | Role | UserRole | Users can have multiple roles |
| Invoice | Payment | PaymentItem | Invoices can have partial payments |

### Self-Referencing Relationships

| Entity | Foreign Key | Description |
|--------|-------------|-------------|
| Department | parentId | Hierarchical department structure |
| GLAccount | parentId | Hierarchical chart of accounts |

## Cardinality Summary

```
Company (1) ─────< (N) User
Company (1) ─────< (N) Vendor
Company (1) ─────< (N) Department
Company (1) ─────< (N) GLAccount
Company (1) ─────< (N) Invoice
Company (1) ─────< (N) Payment
Company (1) ─────< (N) Role

Vendor (1) ──────< (N) Invoice
Vendor (1) ──────< (N) VendorContact

Invoice (1) ─────< (N) InvoiceLineItem
Invoice (1) ─────< (N) Approval
Invoice (1) ─────< (N) Attachment
Invoice (1) ─────< (N) Comment

Payment (1) ─────< (N) PaymentItem

User (N) ────────< (M) Role  [via UserRole]
Invoice (N) ─────< (M) Payment  [via PaymentItem]

Department (1) ──< (N) Department  [self-referencing]
GLAccount (1) ───< (N) GLAccount  [self-referencing]
```

## Data Flow

### Invoice Processing Flow
```
1. Invoice Creation
   └─> Invoice (status: draft)
       └─> InvoiceLineItem(s)
       └─> Attachment(s)

2. Approval Workflow
   └─> Approval (level: 1, status: pending)
       └─> Approval (level: 2, status: pending)
           └─> Invoice (approvalStatus: approved)

3. Payment Processing
   └─> Payment (status: draft)
       └─> PaymentItem
           └─> Invoice (paymentStatus: paid, amountPaid updated)

4. Audit Trail
   └─> AuditLog (all changes tracked)
```

### Key Workflows

1. **Invoice Submission**
   - User creates Invoice
   - System generates Approval records based on amount thresholds
   - Invoice status: draft → pending_approval

2. **Approval Process**
   - Approvers review Invoice
   - Each Approval level completed sequentially
   - Invoice approvalStatus: pending → approved/rejected

3. **Payment Creation**
   - AP creates Payment batch
   - PaymentItems link Invoices to Payment
   - Invoice paymentStatus: unpaid → paid
   - Invoice amountPaid updated

4. **Audit Logging**
   - All CRUD operations logged to AuditLog
   - User actions tracked with IP and timestamp
   - Changes stored as JSON diff
