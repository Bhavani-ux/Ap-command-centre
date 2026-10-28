# AP Command Centre - Approval Engine Design

## Table of Contents
1. [Workflow States](#1-workflow-states)
2. [Approval Rules](#2-approval-rules)
3. [DOA Matrix Logic](#3-doa-matrix-logic)
4. [Escalation Logic](#4-escalation-logic)
5. [State Transitions](#5-state-transitions)
6. [APIs](#6-apis)

---

## 1. Workflow States

### 1.1 Invoice States

#### Primary States

| State | Code | Description | Can Edit | Can Delete | Can Submit | Can Approve | Next States |
|-------|------|-------------|----------|------------|------------|-------------|-------------|
| **Draft** | `draft` | Initial state, invoice being prepared | Yes* | Yes* | Yes | No | `pending_submission`, `cancelled` |
| **Pending Submission** | `pending_submission` | Ready for submission, awaiting final review | Yes* | Yes* | Yes | No | `pending_approval`, `draft`, `cancelled` |
| **Pending Approval** | `pending_approval` | In approval workflow | No** | No | No | Yes | `approved`, `rejected`, `on_hold`, `escalated` |
| **On Hold** | `on_hold` | Temporarily paused | No | No | No | No | `pending_approval`, `rejected`, `cancelled` |
| **Escalated** | `escalated` | Escalated to higher authority | No | No | No | Yes*** | `approved`, `rejected`, `on_hold` |
| **Approved** | `approved` | Fully approved, ready for payment | No | No | No | No | `payment_scheduled`, `cancelled` |
| **Payment Scheduled** | `payment_scheduled` | Included in payment batch | No | No | No | No | `paid`, `payment_failed` |
| **Paid** | `paid` | Payment completed | No | No | No | No | `void`, `reversed` |
| **Partially Paid** | `partially_paid` | Some payment made | No | No | No | No | `paid`, `payment_scheduled` |
| **Rejected** | `rejected` | Rejected by approver | Yes**** | Yes* | Yes | No | `draft`, `pending_approval`, `cancelled` |
| **Cancelled** | `cancelled` | Cancelled by user/system | No | No | No | No | (terminal state) |
| **Void** | `void` | Voided after payment | No | No | No | No | (terminal state) |
| **Reversed** | `reversed` | Payment reversed | No | No | No | No | (terminal state) |

**Notes**:
- `*` Only by creator or AP Manager/Admin
- `**` Only AP Manager/Admin with audit trail
- `***` Only escalation recipient
- `****` Can be revised and resubmitted

#### Sub-States (Approval Progress)

| Sub-State | Description | Triggers |
|-----------|-------------|----------|
| `awaiting_level_1` | Waiting for Level 1 approval | Invoice submitted, amount requires Level 1 |
| `level_1_approved` | Level 1 complete, awaiting Level 2 | Level 1 approver approved |
| `level_2_approved` | Level 2 complete, awaiting Level 3 | Level 2 approver approved |
| `awaiting_escalation_response` | Escalated, waiting for response | Invoice escalated |
| `auto_approved` | Automatically approved by system | Meets auto-approval criteria |

### 1.2 Approval Record States

| State | Description | Final State | Actions Available |
|-------|-------------|-------------|-------------------|
| `pending` | Awaiting approver action | No | Approve, Reject, Delegate, Escalate |
| `approved` | Approver approved | Yes | None (View only) |
| `rejected` | Approver rejected | Yes | None (View only) |
| `delegated` | Delegated to another user | Yes | None (View delegation) |
| `escalated` | Escalated to higher level | Yes | None (View escalation) |
| `expired` | Approval window expired | Yes | None (Requires re-submission) |
| `bypassed` | Bypassed by admin override | Yes | None (View audit) |
| `auto_approved` | Auto-approved by system | Yes | None (View reason) |

### 1.3 Workflow Stage Tracking

```
Stage 1: Creation
  └─> draft

Stage 2: Review
  └─> pending_submission

Stage 3: Approval
  ├─> pending_approval
  │   ├─> awaiting_level_1
  │   ├─> level_1_approved (awaiting_level_2)
  │   └─> level_2_approved (awaiting_level_3)
  ├─> on_hold
  └─> escalated

Stage 4: Approval Complete
  └─> approved

Stage 5: Payment
  ├─> payment_scheduled
  ├─> partially_paid
  └─> paid

Terminal States:
  ├─> rejected
  ├─> cancelled
  ├─> void
  └─> reversed
```

---

## 2. Approval Rules

### 2.1 Rule Types

#### Amount-Based Rules (Primary)

| Rule ID | Rule Name | Condition | Required Approvers | Sequence |
|---------|-----------|-----------|-------------------|----------|
| `RULE_AMT_001` | Small Invoice | Amount ≤ $10,000 | Level 1 | Sequential |
| `RULE_AMT_002` | Medium Invoice | $10,001 ≤ Amount ≤ $50,000 | Level 1 → Level 2 | Sequential |
| `RULE_AMT_003` | Large Invoice | Amount > $50,000 | Level 1 → Level 2 → Level 3 | Sequential |
| `RULE_AMT_004` | Capital Expense | Amount > $100,000 AND GL Account starts with '1' | Level 2 → Level 3 → CFO | Sequential |

#### Department-Based Rules

| Rule ID | Rule Name | Condition | Required Approvers | Sequence |
|---------|-----------|-----------|-------------------|----------|
| `RULE_DEPT_001` | Department Manager | Any amount | Department Manager | First |
| `RULE_DEPT_002` | Cross-Department | Multiple departments in line items | All affected department managers | Parallel |
| `RULE_DEPT_003` | Executive Approval | Department = 'Executive' | VP → CFO → CEO | Sequential |

#### Vendor-Based Rules

| Rule ID | Rule Name | Condition | Required Approvers | Sequence |
|---------|-----------|-----------|-------------------|----------|
| `RULE_VEN_001` | New Vendor | Vendor created < 30 days ago | Level 2 (minimum) | Sequential |
| `RULE_VEN_002` | High-Risk Vendor | Vendor flagged as high-risk | Compliance Officer → Level 2 | Sequential |
| `RULE_VEN_003` | International Vendor | Vendor country ≠ company country | Level 2 (minimum) | Sequential |
| `RULE_VEN_004` | Vendor Threshold | Vendor YTD spend > $500,000 | Level 3 | Add to sequence |

#### GL Account-Based Rules

| Rule ID | Rule Name | Condition | Required Approvers | Sequence |
|---------|-----------|-----------|-------------------|----------|
| `RULE_GL_001` | Capital Expenditure | GL Account type = 'asset' | Level 2 (minimum) | Sequential |
| `RULE_GL_002` | Professional Services | GL Account = '5300-5399' | Level 2 (minimum) | Sequential |
| `RULE_GL_003` | Travel & Entertainment | GL Account = '5700-5799' | Department Manager → Level 1 | Sequential |
| `RULE_GL_004` | Marketing Expense | GL Account = '5800-5899' | Marketing Director → Level 2 | Sequential |

#### Time-Based Rules

| Rule ID | Rule Name | Condition | Required Approvers | Sequence |
|---------|-----------|-----------|-------------------|----------|
| `RULE_TIME_001` | Urgent Invoice | Invoice marked as urgent | Concurrent approval (all levels) | Parallel |
| `RULE_TIME_002` | Past Due Invoice | Invoice due date < today | Expedited (Level 2 minimum) | Sequential (48hr SLA) |
| `RULE_TIME_003` | Month-End Close | Invoice date in previous period | Accounting Manager → Controller | Sequential |
| `RULE_TIME_004` | Weekend/Holiday | Submitted on weekend/holiday | Next business day assignment | Sequential |

#### Duplicate Detection Rules

| Rule ID | Rule Name | Condition | Action | Override |
|---------|-----------|-----------|--------|----------|
| `RULE_DUP_001` | Duplicate Invoice Number | Same vendor + invoice number | Auto-reject | Level 3 |
| `RULE_DUP_002` | Duplicate Amount | Same vendor + amount + date (±3 days) | Require Level 2 | Level 3 |
| `RULE_DUP_003` | Duplicate PO | Same PO number already paid | Auto-reject | AP Manager |

#### Exception Rules

| Rule ID | Rule Name | Condition | Required Approvers | Override |
|---------|-----------|-----------|-------------------|----------|
| `RULE_EXC_001` | Missing PO | No PO number AND amount > $5,000 | Level 2 → Level 3 | CFO |
| `RULE_EXC_002` | Over Budget | Department budget exceeded | Department Manager → CFO | CEO |
| `RULE_EXC_003` | Stale Invoice | Invoice date > 90 days old | Level 2 → Controller | CFO |
| `RULE_EXC_004` | Split Invoice | Multiple invoices from same vendor same day | Level 2 | AP Manager |

### 2.2 Rule Evaluation Order

```
1. Pre-Validation Rules (Can block submission)
   ├─> RULE_DUP_001 (Duplicate Invoice Number)
   └─> RULE_DUP_003 (Duplicate PO)

2. Department Rules (First approval layer)
   ├─> RULE_DEPT_001 (Department Manager)
   └─> RULE_DEPT_002 (Cross-Department)

3. Vendor Rules (Risk assessment)
   ├─> RULE_VEN_001 (New Vendor)
   ├─> RULE_VEN_002 (High-Risk Vendor)
   └─> RULE_VEN_003 (International Vendor)

4. GL Account Rules (Financial controls)
   ├─> RULE_GL_001 (Capital Expenditure)
   ├─> RULE_GL_002 (Professional Services)
   └─> RULE_GL_003 (Travel & Entertainment)

5. Amount Rules (Primary workflow)
   ├─> RULE_AMT_001 (Small Invoice)
   ├─> RULE_AMT_002 (Medium Invoice)
   └─> RULE_AMT_003 (Large Invoice)

6. Exception Rules (Additional checks)
   ├─> RULE_EXC_001 (Missing PO)
   ├─> RULE_EXC_002 (Over Budget)
   └─> RULE_EXC_003 (Stale Invoice)

7. Warning Rules (Can be overridden)
   └─> RULE_DUP_002 (Duplicate Amount)
```

### 2.3 Rule Combination Logic

#### AND Logic (All rules must pass)
```
IF RULE_AMT_002 AND RULE_VEN_001 THEN
  Required: Level 1 → Level 2 (Amount) AND Level 2 (New Vendor)
  Result: Level 1 → Level 2 (combined)
```

#### OR Logic (Any rule triggers requirement)
```
IF RULE_GL_001 OR RULE_VEN_002 THEN
  Required: Level 2 (either Capital or High-Risk)
  Result: Level 2 (single)
```

#### Sequential Addition
```
Base: RULE_AMT_001 (Level 1)
Add: RULE_VEN_001 (Level 2)
Result: Level 1 → Level 2
```

#### Level Elevation
```
Base: RULE_AMT_001 (Level 1)
Override: RULE_EXC_001 (Level 2 → Level 3)
Result: Level 2 → Level 3 (elevated)
```

### 2.4 Auto-Approval Rules

| Rule ID | Condition | Requirements | Max Amount |
|---------|-----------|--------------|------------|
| `RULE_AUTO_001` | Recurring Invoice | Same vendor + amount match (±5%) last 3 months | $5,000 |
| `RULE_AUTO_002` | Pre-Approved Vendor | Vendor in pre-approved list | $2,500 |
| `RULE_AUTO_003` | Contract-Based | Linked to approved contract | Per contract |
| `RULE_AUTO_004` | Subscription/Utility | GL Account = utility/subscription category | $10,000 |

**Auto-Approval Safeguards**:
- Maximum 10 auto-approvals per vendor per month
- Requires 3+ month history
- Random audit sampling (5% of auto-approvals)
- Immediate escalation if variance > 10%

---

## 3. DOA Matrix Logic

### 3.1 Delegation of Authority (DOA) Structure

```
Company Settings
  └─> DOA Policies (multiple)
      ├─> Policy Name
      ├─> Effective Date
      ├─> Expiry Date
      ├─> Priority
      └─> Rules
          ├─> Approval Levels
          ├─> Amount Thresholds
          ├─> Department Scope
          ├─> GL Account Scope
          └─> Vendor Scope
```

### 3.2 DOA Policy Types

#### Standard DOA Policy (Default)

| Level | Role | Amount Range | Required Predecessor | Can Delegate |
|-------|------|--------------|---------------------|--------------|
| 1 | Approver Level 1 | $0 - $10,000 | None | Yes (to same level) |
| 2 | Approver Level 2 | $10,001 - $50,000 | Level 1 | Yes (to same level) |
| 3 | Approver Level 3 | $50,001+ | Level 1 + Level 2 | Yes (to same level) |

#### Department-Specific DOA

| Department | Level | Role | Amount Range | Special Rules |
|------------|-------|------|--------------|---------------|
| IT | 1 | IT Manager | $0 - $25,000 | Software/Hardware only |
| IT | 2 | CTO | $25,001 - $100,000 | Technology spend |
| IT | 3 | CFO + CTO | $100,001+ | Joint approval required |
| Marketing | 1 | Marketing Manager | $0 - $15,000 | Marketing GL accounts |
| Marketing | 2 | CMO | $15,001 - $75,000 | Campaign spend |
| Marketing | 3 | CMO + CFO | $75,001+ | Joint approval required |
| Operations | 1 | Ops Manager | $0 - $20,000 | Operational expenses |
| Operations | 2 | COO | $20,001 - $100,000 | Capital equipment |
| Operations | 3 | COO + CFO | $100,001+ | Major investments |

#### Capital Expenditure DOA

| Level | Role | Amount Range | Requirements |
|-------|------|--------------|--------------|
| 1 | Department Head | $0 - $25,000 | Budget available |
| 2 | VP/Director | $25,001 - $100,000 | ROI analysis required |
| 3 | CFO | $100,001 - $500,000 | Executive committee review |
| 4 | CEO + Board | $500,001+ | Board approval required |

#### Emergency DOA (After Hours / Urgent)

| Level | Role | Amount Range | Conditions | Expiry |
|-------|------|--------------|------------|--------|
| 1 | On-Call Manager | $0 - $5,000 | After hours only | 24 hours |
| 2 | Senior On-Call | $5,001 - $25,000 | Urgent business need | 24 hours |
| 3 | Duty Executive | $25,001+ | Critical business impact | Requires ratification |

### 3.3 DOA Matrix Resolution Algorithm

```
Step 1: Identify Applicable Policies
  ├─> Check effective/expiry dates
  ├─> Filter by department (if specified)
  ├─> Filter by GL account (if specified)
  └─> Filter by vendor (if specified)

Step 2: Calculate Priority Score
  ├─> Specific policy > General policy
  ├─> Department-specific > Company-wide
  ├─> GL-specific > All GL accounts
  └─> Recent effective date > Older date

Step 3: Merge Policies
  ├─> Combine approval levels
  ├─> Take most restrictive amount limits
  ├─> Merge required approvers
  └─> Respect sequential dependencies

Step 4: Generate Approval Chain
  ├─> Determine required levels
  ├─> Assign specific approvers
  ├─> Set approval order
  └─> Calculate SLA for each level

Step 5: Apply Overrides
  ├─> Emergency override (if applicable)
  ├─> Management override (if requested)
  └─> System override (if auto-approve eligible)
```

### 3.4 DOA Conflict Resolution

| Scenario | Resolution |
|----------|------------|
| Multiple policies apply | Use highest priority (most specific) |
| Conflicting amount thresholds | Use lowest threshold (most restrictive) |
| Different approval sequences | Combine and deduplicate |
| Same level, different approvers | Require all approvers (parallel) |
| Circular dependency | Escalate to next level |
| No applicable policy | Fall back to standard DOA |

### 3.5 DOA Override Mechanisms

#### Temporary Override
- **Duration**: 1-30 days
- **Approver**: Company Admin
- **Use Case**: Approver on leave, reorganization
- **Audit**: Full audit trail required
- **Notification**: Original approver notified

#### Permanent Override
- **Duration**: Until changed
- **Approver**: Company Admin
- **Use Case**: Role change, policy update
- **Audit**: Requires approval reason
- **Notification**: All affected parties notified

#### Emergency Override
- **Duration**: 24 hours
- **Approver**: On-call executive
- **Use Case**: After-hours urgent approval
- **Audit**: Must be ratified within 24 hours
- **Notification**: CFO notified immediately

### 3.6 DOA Delegation

#### Delegation Types

| Type | Delegator | Delegate | Duration | Scope | Revocable |
|------|-----------|----------|----------|-------|-----------|
| Temporary | Any approver | Same level | ≤ 30 days | All or specific | Yes |
| Vacation | Any approver | Same level | Date range | All | Yes |
| Partial | Any approver | Same level | Indefinite | Amount/Dept limited | Yes |
| Acting | Manager+ | Lower level | Until return | Full authority | Auto-revokes |

#### Delegation Rules

1. **Cannot delegate upward**: Level 1 cannot delegate to Level 2
2. **Cannot delegate outside scope**: Department manager cannot delegate company-wide
3. **Must be active**: Delegate must be active user with approver role
4. **Audit trail**: All delegations logged
5. **Notification**: Both parties notified
6. **Revocation**: Original delegator can revoke anytime
7. **Expiry**: Auto-expires on specified date
8. **No re-delegation**: Delegate cannot further delegate

---

## 4. Escalation Logic

### 4.1 Escalation Triggers

#### Time-Based Escalation

| Trigger | Condition | Escalate To | SLA Warning | Action |
|---------|-----------|-------------|-------------|--------|
| `ESC_TIME_001` | No action after 24 hours | Next level approver | 80% SLA | Email + Dashboard alert |
| `ESC_TIME_002` | No action after 48 hours | Department head | 100% SLA | Email + SMS |
| `ESC_TIME_003` | No action after 72 hours | VP/Director | Overdue | Email + SMS + Escalation flag |
| `ESC_TIME_004` | No action after 5 days | CFO | Critical overdue | All notifications + Management report |

#### Amount-Based Escalation

| Trigger | Condition | Escalate To | Reason |
|---------|-----------|-------------|--------|
| `ESC_AMT_001` | Amount > Approver DOA limit | Next level | Exceeds authority |
| `ESC_AMT_002` | Amount > $500,000 | CEO + Board | Major expenditure |
| `ESC_AMT_003` | Cumulative vendor amount > threshold | VP Finance | Vendor concentration risk |

#### Risk-Based Escalation

| Trigger | Condition | Escalate To | Reason |
|---------|-----------|-------------|--------|
| `ESC_RISK_001` | High-risk vendor | Compliance Officer | Vendor risk |
| `ESC_RISK_002` | Duplicate detection | AP Manager | Potential duplicate |
| `ESC_RISK_003` | Invoice amount variance > 20% | Level 2 | Significant variance |
| `ESC_RISK_004` | Missing documentation | AP Manager | Incomplete submission |
| `ESC_RISK_005` | Unusual GL account usage | Controller | Policy compliance |

#### Business Rule Escalation

| Trigger | Condition | Escalate To | Reason |
|---------|-----------|-------------|--------|
| `ESC_BUS_001` | Budget overrun | Department head + CFO | Budget control |
| `ESC_BUS_002` | No PO for amount > $5,000 | Purchasing Manager | PO policy violation |
| `ESC_BUS_003` | Contract not on file | Legal + AP Manager | Contract compliance |
| `ESC_BUS_004` | Cross-department allocation | All dept heads | Multi-department approval |

#### User-Initiated Escalation

| Trigger | Who Can Escalate | Escalate To | Requirements |
|---------|------------------|-------------|--------------|
| `ESC_USER_001` | Current approver | Next level | Requires comment |
| `ESC_USER_002` | Invoice creator | AP Manager | Urgent need justification |
| `ESC_USER_003` | AP Manager | CFO | Management override |

### 4.2 Escalation Workflow

```
Normal Flow:
Invoice → Level 1 Pending → Level 1 Approved → Level 2 Pending → Level 2 Approved → Approved

Escalation Flow (Time):
Invoice → Level 1 Pending (24h) → Escalation Warning → (48h) → Escalated to Level 2 → Level 2 Overrides → Approved

Escalation Flow (Amount):
Invoice → Level 1 Pending → Level 1 Approved → Level 2 Pending → Amount Check Fails → Escalated to Level 3 → Level 3 Decides

Escalation Flow (Risk):
Invoice → Level 1 Pending → Risk Detected → Immediate Escalation to AP Manager → Review → Return to Level 1 or Escalate Further

Escalation Flow (User):
Invoice → Level 1 Pending → Approver Escalates → Level 2 Notified (urgent) → Level 2 Decides
```

### 4.3 Escalation Actions

#### Automatic Actions
1. **Notification**: Email + SMS to escalation recipient
2. **Priority**: Mark invoice as escalated (high priority)
3. **SLA**: Reset SLA timer for new approver
4. **Audit**: Log escalation reason and trigger
5. **Dashboard**: Update all relevant dashboards
6. **Reporting**: Add to escalation report

#### Escalation Recipient Actions
- **Review**: View invoice with escalation context
- **Approve**: Approve on behalf of original approver
- **Reject**: Reject with reason
- **Reassign**: Assign to different approver
- **De-escalate**: Return to original approver with guidance
- **Request Info**: Ask for additional information

### 4.4 Escalation SLA

| Priority | Level 1 SLA | Level 2 SLA | Level 3 SLA | Escalation SLA |
|----------|-------------|-------------|-------------|----------------|
| Low | 5 days | 3 days | 2 days | +2 days each level |
| Normal | 3 days | 2 days | 1 day | +1 day each level |
| High | 1 day | 12 hours | 6 hours | +6 hours each level |
| Urgent | 4 hours | 2 hours | 1 hour | +1 hour each level |
| Critical | 1 hour | 30 min | 15 min | Immediate |

**SLA Calculation**:
```
Base SLA = Policy-defined SLA for approval level
Warning Threshold = 80% of base SLA
Escalation Trigger = 100% of base SLA
Critical Threshold = 150% of base SLA

Example:
Level 1, Normal Priority:
- Base SLA: 3 days (72 hours)
- Warning: 57.6 hours (email notification)
- Escalation: 72 hours (escalate to Level 2)
- Critical: 108 hours (escalate to CFO)
```

### 4.5 Escalation Notification Templates

#### Warning Notification (80% SLA)
```
To: Original Approver
Subject: Approval Required - Invoice [Invoice Number]
Priority: High

Action Required:
Invoice #[INV-123] from [Vendor] for [Amount] requires your approval.

Current Status: Pending your approval for [X] hours
SLA: [Y] hours remaining before escalation

[View Invoice Button]
```

#### Escalation Notification (100% SLA)
```
To: Next Level Approver, Original Approver (CC), AP Manager (CC)
Subject: ESCALATED - Invoice [Invoice Number] Approval Required
Priority: Urgent

Escalation Alert:
Invoice #[INV-123] from [Vendor] for [Amount] has been escalated to you.

Reason: No action taken by [Original Approver] within [X] hours
Original Due: [Date/Time]
New SLA: [Y] hours

[View Invoice Button] [Escalation History Button]
```

### 4.6 Escalation Analytics

Track and report on:
1. **Escalation Rate**: % of invoices escalated
2. **Escalation Reasons**: Breakdown by trigger type
3. **Time to Escalation**: Average time before escalation
4. **Resolution Time**: Average time to resolve after escalation
5. **Approver Performance**: Escalations per approver
6. **Cost of Delay**: Impact of escalation on payment terms

---

## 5. State Transitions

### 5.1 Complete State Transition Matrix

| Current State | Action | Actor | Conditions | Next State | Side Effects |
|--------------|--------|-------|------------|------------|--------------|
| **draft** | Save | Creator, AP Clerk | None | draft | Update invoice |
| **draft** | Submit | Creator, AP Clerk | Validation passes | pending_approval | Create approval records, notify approvers |
| **draft** | Delete | Creator, AP Manager | None | (deleted) | Soft delete, audit log |
| **draft** | Cancel | Creator, AP Manager | None | cancelled | Audit log |
| **pending_approval** | Approve (L1) | Level 1 Approver | Amount ≤ $10k | approved | Close approval, notify payment team |
| **pending_approval** | Approve (L1) | Level 1 Approver | Amount > $10k | pending_approval (L2) | Update sub-state, notify L2 approver |
| **pending_approval** | Approve (L2) | Level 2 Approver | L1 approved, Amount ≤ $50k | approved | Close approval, notify payment team |
| **pending_approval** | Approve (L2) | Level 2 Approver | L1 approved, Amount > $50k | pending_approval (L3) | Update sub-state, notify L3 approver |
| **pending_approval** | Approve (L3) | Level 3 Approver | L1+L2 approved | approved | Close approval, notify payment team |
| **pending_approval** | Reject | Any Approver | None | rejected | Close approval, notify creator |
| **pending_approval** | Hold | Any Approver | Requires comment | on_hold | Pause SLA timer, notify stakeholders |
| **pending_approval** | Escalate | Approver, System | SLA breach or manual | escalated | Notify escalation recipient, reset SLA |
| **pending_approval** | Request Changes | Any Approver | None | draft | Return to creator, notify creator |
| **pending_approval** | Delegate | Any Approver | Valid delegate | pending_approval | Update approver, notify delegate |
| **on_hold** | Resume | Holder, AP Manager | None | pending_approval | Resume SLA timer, notify approver |
| **on_hold** | Reject | Holder, AP Manager | None | rejected | Close approval, notify creator |
| **on_hold** | Cancel | Creator, AP Manager | None | cancelled | Audit log |
| **escalated** | Approve | Escalation Recipient | None | approved | Close approval, notify all parties |
| **escalated** | Reject | Escalation Recipient | None | rejected | Close approval, notify all parties |
| **escalated** | De-escalate | Escalation Recipient | Requires comment | pending_approval | Return to original approver, notify |
| **escalated** | Reassign | Escalation Recipient | Valid approver | pending_approval | Assign new approver, notify |
| **approved** | Schedule Payment | AP Clerk, AP Manager | None | payment_scheduled | Add to payment batch |
| **approved** | Cancel | AP Manager, CFO | Requires reason | cancelled | Audit log, notify approver |
| **payment_scheduled** | Process Payment | AP Manager | Payment batch approved | paid | Update amount_paid, notify vendor |
| **payment_scheduled** | Process Payment | AP Manager | Partial payment | partially_paid | Update amount_paid, notify vendor |
| **payment_scheduled** | Payment Failed | System | Payment error | approved | Notify AP team, log error |
| **payment_scheduled** | Remove from Batch | AP Manager | Before processing | approved | Update payment batch |
| **partially_paid** | Process Payment | AP Manager | Remaining balance paid | paid | Update amount_paid, notify vendor |
| **partially_paid** | Schedule Payment | AP Clerk | None | payment_scheduled | Add remaining to batch |
| **paid** | Void | AP Manager, CFO | Within 30 days, Requires reason | void | Reverse payment, audit log |
| **paid** | Reverse | Finance, Bank | Payment reversed | reversed | Update records, notify AP team |
| **rejected** | Revise | Creator | None | draft | Allow editing, notify creator |
| **rejected** | Cancel | Creator, AP Manager | None | cancelled | Audit log |
| **cancelled** | (none) | | | (terminal) | No transitions allowed |
| **void** | (none) | | | (terminal) | No transitions allowed |
| **reversed** | (none) | | | (terminal) | No transitions allowed |

### 5.2 Transition Guards (Pre-conditions)

#### Approval Transition Guards
```
Guard: CanApprove
Checks:
  ✓ User has approver role at required level
  ✓ User is not the invoice creator
  ✓ User has not already approved this invoice
  ✓ Previous approval levels completed (if sequential)
  ✓ Amount within user's DOA limit
  ✓ Invoice status is pending_approval or escalated
  ✓ User's delegation status valid
```

#### Submission Transition Guards
```
Guard: CanSubmit
Checks:
  ✓ Invoice status is draft or rejected
  ✓ User is creator or has submission permission
  ✓ All required fields populated
  ✓ At least one line item exists
  ✓ Line items total matches invoice total
  ✓ GL accounts valid and active
  ✓ Vendor is active
  ✓ No blocking validation errors
  ✓ Attachments uploaded (if required by policy)
```

#### Payment Transition Guards
```
Guard: CanSchedulePayment
Checks:
  ✓ Invoice status is approved
  ✓ User has payment scheduling permission
  ✓ Invoice not already in payment batch
  ✓ Payment date not in the past
  ✓ Vendor bank details complete
  ✓ No payment holds on vendor
```

#### Edit Transition Guards
```
Guard: CanEdit
Checks:
  ✓ Invoice status is draft or rejected
  ✓ User is creator OR has edit permission
  ✓ Invoice not locked by another user
  ✓ No payments processed
```

#### Delete Transition Guards
```
Guard: CanDelete
Checks:
  ✓ Invoice status is draft or rejected
  ✓ User has delete permission
  ✓ No approvals completed
  ✓ No payments processed
  ✓ No audit holds
```

### 5.3 Transition Side Effects

#### On Submit
1. Generate approval chain based on DOA matrix
2. Create approval records for each required approver
3. Calculate SLA deadlines for each level
4. Send notifications to Level 1 approvers
5. Update invoice sub-state to awaiting_level_1
6. Log submission in audit trail
7. Update dashboard metrics
8. Trigger duplicate detection checks

#### On Approve
1. Update approval record status to approved
2. Calculate if more approvals needed
3. If complete: transition invoice to approved
4. If incomplete: notify next level approver(s)
5. Update sub-state
6. Log approval in audit trail
7. Update approver metrics
8. Check for escalation resolution
9. Send confirmation to invoice creator
10. Update dashboard metrics

#### On Reject
1. Update approval record status to rejected
2. Transition invoice to rejected state
3. Send notification to invoice creator with reason
4. Log rejection in audit trail
5. Update approver metrics
6. Close all pending approvals
7. Update dashboard metrics
8. Archive approval workflow

#### On Escalate
1. Determine escalation recipient
2. Create escalation record
3. Update invoice state to escalated
4. Reset SLA timer
5. Send urgent notification to escalation recipient
6. CC all relevant parties
7. Log escalation in audit trail
8. Update escalation metrics
9. Flag invoice as high priority
10. Update dashboard with escalation indicator

#### On Payment Complete
1. Update invoice state to paid
2. Update amount_paid field
3. Generate payment confirmation
4. Send notification to vendor (if configured)
5. Update vendor payment history
6. Close invoice workflow
7. Log payment in audit trail
8. Update cash flow projections
9. Trigger GL posting (if integrated)
10. Update payment metrics

### 5.4 State Transition Events

All state transitions emit events for:
- **Audit Logging**: Record who, what, when, why
- **Notifications**: Email, SMS, in-app alerts
- **Webhooks**: External system integration
- **Analytics**: Real-time metrics updates
- **Workflow Triggers**: Cascade to dependent processes

Event Structure:
```json
{
  "event_id": "uuid",
  "event_type": "invoice.state.transition",
  "timestamp": "ISO 8601",
  "invoice_id": "uuid",
  "from_state": "pending_approval",
  "to_state": "approved",
  "actor": {
    "user_id": "uuid",
    "role": "Approver Level 2",
    "ip_address": "x.x.x.x"
  },
  "metadata": {
    "approval_level": 2,
    "amount": 25000.00,
    "comment": "Approved - budget available"
  },
  "company_id": "uuid"
}
```

---

## 6. APIs

### 6.1 Approval Management APIs

#### Submit Invoice for Approval
```
POST /api/invoices/{invoiceId}/submit

Request:
{
  "priority": "normal" | "high" | "urgent",
  "comments": "string (optional)",
  "dueDate": "date (optional)"
}

Response 200:
{
  "invoiceId": "uuid",
  "status": "pending_approval",
  "approvalChain": [
    {
      "level": 1,
      "approvers": [
        {
          "userId": "uuid",
          "name": "John Doe",
          "role": "Approver Level 1"
        }
      ],
      "dueDate": "ISO 8601",
      "status": "pending"
    },
    {
      "level": 2,
      "approvers": [...],
      "dueDate": "ISO 8601",
      "status": "awaiting_predecessor"
    }
  ],
  "submittedAt": "ISO 8601",
  "submittedBy": "uuid"
}

Response 400: Validation errors
Response 403: Insufficient permissions
Response 409: Invoice already in approval
```

#### Approve Invoice
```
POST /api/invoices/{invoiceId}/approve

Request:
{
  "comments": "string (optional)",
  "attachments": ["uuid"] (optional)
}

Response 200:
{
  "invoiceId": "uuid",
  "approvalId": "uuid",
  "status": "approved" | "pending_approval",
  "nextApprover": {
    "level": 2,
    "approvers": [...],
    "dueDate": "ISO 8601"
  } (if pending_approval),
  "approvedAt": "ISO 8601",
  "approvedBy": "uuid",
  "message": "Invoice approved and moved to Level 2" | "Invoice fully approved"
}

Response 400: Invalid state
Response 403: Insufficient DOA or permissions
Response 404: Invoice not found
```

#### Reject Invoice
```
POST /api/invoices/{invoiceId}/reject

Request:
{
  "reason": "string (required)",
  "comments": "string (optional)",
  "allowResubmission": boolean
}

Response 200:
{
  "invoiceId": "uuid",
  "approvalId": "uuid",
  "status": "rejected",
  "rejectedAt": "ISO 8601",
  "rejectedBy": "uuid",
  "reason": "string",
  "canResubmit": boolean
}

Response 400: Reason required
Response 403: Insufficient permissions
Response 404: Invoice not found
```

#### Hold Invoice
```
POST /api/invoices/{invoiceId}/hold

Request:
{
  "reason": "string (required)",
  "expectedResolutionDate": "date (optional)"
}

Response 200:
{
  "invoiceId": "uuid",
  "status": "on_hold",
  "heldAt": "ISO 8601",
  "heldBy": "uuid",
  "reason": "string",
  "expectedResolutionDate": "date"
}

Response 403: Insufficient permissions
Response 404: Invoice not found
```

#### Resume Held Invoice
```
POST /api/invoices/{invoiceId}/resume

Request:
{
  "comments": "string (optional)"
}

Response 200:
{
  "invoiceId": "uuid",
  "status": "pending_approval",
  "resumedAt": "ISO 8601",
  "resumedBy": "uuid",
  "currentApprover": {...}
}

Response 400: Invoice not on hold
Response 403: Insufficient permissions
```

#### Escalate Invoice
```
POST /api/invoices/{invoiceId}/escalate

Request:
{
  "reason": "string (required)",
  "escalateTo": "uuid (optional)",
  "priority": "high" | "urgent" | "critical"
}

Response 200:
{
  "invoiceId": "uuid",
  "status": "escalated",
  "escalatedAt": "ISO 8601",
  "escalatedBy": "uuid",
  "escalationRecipient": {
    "userId": "uuid",
    "name": "string",
    "role": "string"
  },
  "reason": "string",
  "newSLA": "ISO 8601"
}

Response 403: Insufficient permissions
Response 404: Invoice not found
```

#### Delegate Approval
```
POST /api/approvals/{approvalId}/delegate

Request:
{
  "delegateTo": "uuid (required)",
  "reason": "string (optional)",
  "startDate": "date (optional, default: now)",
  "endDate": "date (optional)",
  "scope": "all" | "amount_limited" | "department_limited",
  "amountLimit": number (if scope = amount_limited)
}

Response 200:
{
  "delegationId": "uuid",
  "approvalId": "uuid",
  "delegator": "uuid",
  "delegate": "uuid",
  "startDate": "date",
  "endDate": "date",
  "scope": "string",
  "status": "active"
}

Response 400: Invalid delegate or scope
Response 403: Cannot delegate this approval
Response 404: Approval not found
```

#### Request Changes
```
POST /api/invoices/{invoiceId}/request-changes

Request:
{
  "changes": [
    {
      "field": "string",
      "currentValue": "any",
      "requestedValue": "any",
      "reason": "string"
    }
  ],
  "comments": "string (optional)",
  "dueDate": "date (optional)"
}

Response 200:
{
  "invoiceId": "uuid",
  "status": "draft",
  "changeRequestId": "uuid",
  "requestedAt": "ISO 8601",
  "requestedBy": "uuid",
  "dueDate": "date",
  "changes": [...]
}

Response 403: Insufficient permissions
Response 404: Invoice not found
```

### 6.2 Approval Query APIs

#### Get Pending Approvals
```
GET /api/approvals/pending

Query Parameters:
- page: number (default: 1)
- limit: number (default: 20, max: 100)
- sortBy: "dueDate" | "amount" | "submittedDate" | "priority"
- sortOrder: "asc" | "desc"
- priority: "low" | "normal" | "high" | "urgent" | "critical"
- vendor: uuid
- department: uuid
- amountMin: number
- amountMax: number
- overdueOnly: boolean

Response 200:
{
  "approvals": [
    {
      "approvalId": "uuid",
      "invoiceId": "uuid",
      "invoiceNumber": "string",
      "vendor": {
        "id": "uuid",
        "name": "string"
      },
      "amount": number,
      "currency": "string",
      "submittedDate": "ISO 8601",
      "dueDate": "ISO 8601",
      "priority": "string",
      "status": "pending",
      "level": number,
      "slaRemaining": "duration (e.g., 2h 30m)",
      "isOverdue": boolean,
      "creator": {
        "id": "uuid",
        "name": "string"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "summary": {
    "totalPending": 150,
    "overdue": 12,
    "dueToday": 8,
    "dueThisWeek": 45
  }
}
```

#### Get Approval History
```
GET /api/invoices/{invoiceId}/approvals

Response 200:
{
  "invoiceId": "uuid",
  "approvals": [
    {
      "approvalId": "uuid",
      "level": 1,
      "approver": {
        "userId": "uuid",
        "name": "string",
        "role": "string"
      },
      "status": "approved",
      "submittedAt": "ISO 8601",
      "actionAt": "ISO 8601",
      "timeToAction": "duration",
      "comments": "string",
      "attachments": [...]
    }
  ],
  "escalations": [
    {
      "escalationId": "uuid",
      "reason": "string",
      "escalatedAt": "ISO 8601",
      "escalatedBy": "uuid",
      "escalatedTo": "uuid",
      "resolution": "approved" | "rejected"
    }
  ],
  "delegations": [...]
}
```

#### Get Approval Statistics
```
GET /api/approvals/statistics

Query Parameters:
- startDate: date
- endDate: date
- groupBy: "day" | "week" | "month"
- department: uuid (optional)
- approver: uuid (optional)

Response 200:
{
  "period": {
    "startDate": "date",
    "endDate": "date"
  },
  "statistics": {
    "totalApprovals": 450,
    "approved": 380,
    "rejected": 45,
    "pending": 25,
    "averageTimeToApprove": "2.5 days",
    "escalationRate": 8.5,
    "autoApprovalRate": 12.3,
    "slaComplianceRate": 92.5
  },
  "byLevel": [
    {
      "level": 1,
      "total": 450,
      "approved": 410,
      "rejected": 15,
      "averageTime": "1.2 days",
      "slaCompliance": 95.2
    }
  ],
  "byApprover": [
    {
      "approverId": "uuid",
      "name": "string",
      "total": 45,
      "approved": 40,
      "rejected": 3,
      "pending": 2,
      "averageTime": "1.5 days"
    }
  ]
}
```

### 6.3 DOA Management APIs

#### Get DOA Policies
```
GET /api/doa/policies

Query Parameters:
- active: boolean
- department: uuid
- effectiveDate: date

Response 200:
{
  "policies": [
    {
      "policyId": "uuid",
      "name": "string",
      "description": "string",
      "priority": number,
      "effectiveDate": "date",
      "expiryDate": "date",
      "isActive": boolean,
      "scope": {
        "departments": ["uuid"],
        "glAccounts": ["string"],
        "vendors": ["uuid"]
      },
      "levels": [
        {
          "level": 1,
          "role": "Approver Level 1",
          "amountMin": 0,
          "amountMax": 10000,
          "requiredPredecessor": null,
          "canDelegate": true
        }
      ]
    }
  ]
}
```

#### Create DOA Policy
```
POST /api/doa/policies

Request:
{
  "name": "string (required)",
  "description": "string",
  "priority": number,
  "effectiveDate": "date (required)",
  "expiryDate": "date (optional)",
  "scope": {
    "departments": ["uuid"],
    "glAccounts": ["string"],
    "vendors": ["uuid"]
  },
  "levels": [
    {
      "level": number,
      "role": "string",
      "amountMin": number,
      "amountMax": number,
      "requiredPredecessor": number,
      "canDelegate": boolean
    }
  ]
}

Response 201:
{
  "policyId": "uuid",
  "name": "string",
  "createdAt": "ISO 8601",
  "createdBy": "uuid"
}

Response 400: Validation errors
Response 403: Insufficient permissions
```

#### Calculate Approval Chain
```
POST /api/doa/calculate-chain

Request:
{
  "amount": number (required),
  "currency": "string",
  "vendorId": "uuid",
  "departmentId": "uuid",
  "glAccounts": ["string"],
  "urgent": boolean,
  "simulationMode": boolean (optional, doesn't create approvals)
}

Response 200:
{
  "approvalChain": [
    {
      "level": 1,
      "approvers": [
        {
          "userId": "uuid",
          "name": "string",
          "role": "string",
          "doaLimit": number
        }
      ],
      "sla": "duration",
      "dueDate": "ISO 8601",
      "canDelegate": boolean,
      "isRequired": true
    }
  ],
  "appliedPolicies": [
    {
      "policyId": "uuid",
      "name": "string",
      "reason": "Amount-based rule"
    }
  ],
  "estimatedCompletionTime": "duration",
  "autoApprovalEligible": boolean,
  "warnings": [
    "New vendor - additional approval required"
  ]
}

Response 400: Invalid parameters
```

### 6.4 Escalation APIs

#### Get Escalations
```
GET /api/escalations

Query Parameters:
- status: "active" | "resolved"
- startDate: date
- endDate: date
- department: uuid

Response 200:
{
  "escalations": [
    {
      "escalationId": "uuid",
      "invoiceId": "uuid",
      "invoiceNumber": "string",
      "vendor": {...},
      "amount": number,
      "reason": "SLA breach",
      "escalatedAt": "ISO 8601",
      "escalatedBy": "uuid",
      "escalatedTo": "uuid",
      "status": "active",
      "resolution": null,
      "resolvedAt": null
    }
  ]
}
```

#### Resolve Escalation
```
POST /api/escalations/{escalationId}/resolve

Request:
{
  "action": "approve" | "reject" | "de-escalate" | "reassign",
  "comments": "string",
  "reassignTo": "uuid (if action = reassign)"
}

Response 200:
{
  "escalationId": "uuid",
  "status": "resolved",
  "resolution": "approved",
  "resolvedAt": "ISO 8601",
  "resolvedBy": "uuid"
}

Response 403: Insufficient permissions
Response 404: Escalation not found
```

### 6.5 Workflow Configuration APIs

#### Get Approval Rules
```
GET /api/approval-rules

Response 200:
{
  "rules": [
    {
      "ruleId": "string",
      "name": "string",
      "type": "amount" | "department" | "vendor" | "gl_account" | "time" | "exception",
      "condition": {...},
      "action": {...},
      "priority": number,
      "isActive": boolean
    }
  ]
}
```

#### Update Approval Rule
```
PUT /api/approval-rules/{ruleId}

Request:
{
  "name": "string",
  "condition": {...},
  "action": {...},
  "isActive": boolean
}

Response 200:
{
  "ruleId": "string",
  "updatedAt": "ISO 8601",
  "updatedBy": "uuid"
}

Response 403: Insufficient permissions
Response 404: Rule not found
```

#### Test Approval Rules
```
POST /api/approval-rules/test

Request:
{
  "invoice": {
    "amount": number,
    "vendorId": "uuid",
    "departmentId": "uuid",
    "glAccounts": ["string"],
    "invoiceDate": "date"
  }
}

Response 200:
{
  "matchedRules": [
    {
      "ruleId": "string",
      "name": "string",
      "matched": true,
      "impact": "Requires Level 2 approval"
    }
  ],
  "finalApprovalChain": [...],
  "warnings": [],
  "autoApprovalEligible": boolean
}
```

### 6.6 Notification APIs

#### Get Approval Notifications
```
GET /api/approvals/notifications

Query Parameters:
- unreadOnly: boolean
- limit: number

Response 200:
{
  "notifications": [
    {
      "notificationId": "uuid",
      "type": "approval_required" | "approval_approved" | "approval_rejected" | "escalation",
      "invoiceId": "uuid",
      "invoiceNumber": "string",
      "message": "string",
      "priority": "normal" | "high" | "urgent",
      "isRead": boolean,
      "createdAt": "ISO 8601",
      "actionUrl": "string"
    }
  ],
  "unreadCount": number
}
```

#### Mark Notification as Read
```
POST /api/approvals/notifications/{notificationId}/read

Response 200:
{
  "notificationId": "uuid",
  "isRead": true,
  "readAt": "ISO 8601"
}
```

### 6.7 Bulk Operations APIs

#### Bulk Approve
```
POST /api/approvals/bulk-approve

Request:
{
  "approvalIds": ["uuid"],
  "comments": "string (optional)"
}

Response 200:
{
  "results": [
    {
      "approvalId": "uuid",
      "invoiceId": "uuid",
      "success": boolean,
      "status": "approved" | "error",
      "message": "string"
    }
  ],
  "summary": {
    "total": 10,
    "successful": 9,
    "failed": 1
  }
}

Response 400: Invalid approvalIds
Response 403: Insufficient permissions
```

#### Bulk Delegate
```
POST /api/approvals/bulk-delegate

Request:
{
  "delegateTo": "uuid (required)",
  "startDate": "date",
  "endDate": "date",
  "reason": "string"
}

Response 200:
{
  "delegationId": "uuid",
  "affectedApprovals": number,
  "delegate": {...},
  "period": {
    "startDate": "date",
    "endDate": "date"
  }
}

Response 403: Insufficient permissions
```

---

## 7. Implementation Checklist

### 7.1 Core Workflow
- [ ] Implement state machine for invoice workflow
- [ ] Create approval record generation logic
- [ ] Build DOA matrix evaluation engine
- [ ] Implement approval chain calculation
- [ ] Create SLA tracking mechanism
- [ ] Build state transition validators (guards)
- [ ] Implement side effects for each transition

### 7.2 Approval Rules
- [ ] Implement rule evaluation engine
- [ ] Create rule priority system
- [ ] Build rule combination logic (AND/OR)
- [ ] Implement auto-approval detection
- [ ] Create duplicate detection system
- [ ] Build exception handling rules
- [ ] Implement rule testing framework

### 7.3 Escalation System
- [ ] Create time-based escalation scheduler
- [ ] Implement escalation notification system
- [ ] Build escalation recipient determination logic
- [ ] Create escalation resolution workflow
- [ ] Implement SLA calculation and tracking
- [ ] Build escalation analytics

### 7.4 DOA Management
- [ ] Create DOA policy storage and retrieval
- [ ] Implement policy priority resolution
- [ ] Build delegation tracking system
- [ ] Create temporary/permanent override mechanism
- [ ] Implement DOA conflict resolution
- [ ] Build DOA audit trail

### 7.5 APIs
- [ ] Implement all approval management endpoints
- [ ] Create query APIs with filtering
- [ ] Build DOA management APIs
- [ ] Implement escalation APIs
- [ ] Create workflow configuration APIs
- [ ] Build notification APIs
- [ ] Implement bulk operation APIs

### 7.6 Notifications
- [ ] Email notification templates
- [ ] SMS notification for urgent approvals
- [ ] In-app notification system
- [ ] Webhook system for external integrations
- [ ] Notification preference management

### 7.7 Analytics & Reporting
- [ ] Approval metrics dashboard
- [ ] Escalation rate tracking
- [ ] SLA compliance reporting
- [ ] Approver performance metrics
- [ ] Bottleneck identification
- [ ] Auto-approval rate tracking

### 7.8 Testing
- [ ] Unit tests for state transitions
- [ ] Integration tests for approval workflows
- [ ] Load tests for concurrent approvals
- [ ] Test DOA matrix scenarios
- [ ] Test escalation triggers
- [ ] Test delegation scenarios
- [ ] Test bulk operations

---

## 8. Best Practices

### 8.1 Performance
- Cache DOA policies by company
- Index approval records by status and approver
- Use background jobs for escalation checks
- Batch notification sending
- Optimize approval chain calculation

### 8.2 Security
- Validate approver DOA limits server-side
- Audit all state transitions
- Prevent self-approval
- Validate approval sequence integrity
- Log all delegation actions
- Require re-authentication for high-value approvals

### 8.3 Usability
- Clear approval comments required
- Mobile-friendly approval interface
- One-click approval for eligible invoices
- Bulk approval for similar invoices
- Saved approval reasons
- Approval preview before submission

### 8.4 Reliability
- Idempotent approval operations
- Graceful handling of concurrent approvals
- Retry logic for notification failures
- Escalation failover mechanism
- Transaction consistency for state changes
