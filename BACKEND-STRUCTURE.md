# AP Command Centre - Backend Project Structure

```
ap-command-centre/
│
├── .env.example
├── .env.local
├── .env.test
├── .env.production
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── tsconfig.json
├── package.json
├── package-lock.json
├── README.md
├── docker-compose.yml
├── Dockerfile
├── .dockerignore
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── migrations/
│   │   ├── 20241027000001_init/
│   │   │   └── migration.sql
│   │   ├── 20241027000002_add_approval_fields/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── seeds/
│       ├── companies.seed.ts
│       ├── roles.seed.ts
│       ├── users.seed.ts
│       ├── departments.seed.ts
│       ├── gl-accounts.seed.ts
│       └── index.ts
│
├── src/
│   ├── index.ts
│   ├── server.ts
│   ├── app.ts
│   │
│   ├── config/
│   │   ├── index.ts
│   │   ├── database.config.ts
│   │   ├── auth.config.ts
│   │   ├── email.config.ts
│   │   ├── sms.config.ts
│   │   ├── storage.config.ts
│   │   ├── logger.config.ts
│   │   ├── redis.config.ts
│   │   ├── queue.config.ts
│   │   └── constants.ts
│   │
│   ├── core/
│   │   ├── database/
│   │   │   ├── prisma.client.ts
│   │   │   ├── transaction.manager.ts
│   │   │   └── connection.pool.ts
│   │   │
│   │   ├── errors/
│   │   │   ├── index.ts
│   │   │   ├── app.error.ts
│   │   │   ├── validation.error.ts
│   │   │   ├── authentication.error.ts
│   │   │   ├── authorization.error.ts
│   │   │   ├── not-found.error.ts
│   │   │   ├── conflict.error.ts
│   │   │   ├── business-rule.error.ts
│   │   │   └── error-codes.ts
│   │   │
│   │   ├── interfaces/
│   │   │   ├── controller.interface.ts
│   │   │   ├── service.interface.ts
│   │   │   ├── repository.interface.ts
│   │   │   ├── middleware.interface.ts
│   │   │   ├── request.interface.ts
│   │   │   ├── response.interface.ts
│   │   │   └── pagination.interface.ts
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── express.d.ts
│   │   │   ├── auth.types.ts
│   │   │   ├── approval.types.ts
│   │   │   ├── payment.types.ts
│   │   │   └── common.types.ts
│   │   │
│   │   └── utils/
│   │       ├── index.ts
│   │       ├── date.util.ts
│   │       ├── string.util.ts
│   │       ├── number.util.ts
│   │       ├── validation.util.ts
│   │       ├── encryption.util.ts
│   │       ├── hash.util.ts
│   │       ├── pagination.util.ts
│   │       ├── query-builder.util.ts
│   │       └── file.util.ts
│   │
│   ├── middleware/
│   │   ├── index.ts
│   │   ├── error-handler.middleware.ts
│   │   ├── request-logger.middleware.ts
│   │   ├── request-validator.middleware.ts
│   │   ├── response-formatter.middleware.ts
│   │   ├── cors.middleware.ts
│   │   ├── helmet.middleware.ts
│   │   ├── compression.middleware.ts
│   │   ├── rate-limiter.middleware.ts
│   │   ├── file-upload.middleware.ts
│   │   ├── sanitization.middleware.ts
│   │   └── tenant-context.middleware.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── session.controller.ts
│   │   │   │   └── password.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── token.service.ts
│   │   │   │   ├── session.service.ts
│   │   │   │   ├── password.service.ts
│   │   │   │   └── refresh-token.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   ├── session.repository.ts
│   │   │   │   └── refresh-token.repository.ts
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── jwt.middleware.ts
│   │   │   │   └── session-validator.middleware.ts
│   │   │   │
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── role.guard.ts
│   │   │   │   ├── permission.guard.ts
│   │   │   │   ├── ownership.guard.ts
│   │   │   │   ├── status.guard.ts
│   │   │   │   ├── amount.guard.ts
│   │   │   │   ├── company.guard.ts
│   │   │   │   └── rate-limit.guard.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   ├── forgot-password.dto.ts
│   │   │   │   ├── reset-password.dto.ts
│   │   │   │   └── change-password.dto.ts
│   │   │   │
│   │   │   ├── validators/
│   │   │   │   ├── login.validator.ts
│   │   │   │   ├── password.validator.ts
│   │   │   │   └── token.validator.ts
│   │   │   │
│   │   │   └── strategies/
│   │   │       ├── jwt.strategy.ts
│   │   │       ├── local.strategy.ts
│   │   │       └── refresh-token.strategy.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── user-roles.controller.ts
│   │   │   │   └── user-profile.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── user-roles.service.ts
│   │   │   │   ├── user-validation.service.ts
│   │   │   │   └── user-profile.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   ├── users.repository.ts
│   │   │   │   └── user-roles.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   ├── user-query.dto.ts
│   │   │   │   ├── assign-role.dto.ts
│   │   │   │   └── update-profile.dto.ts
│   │   │   │
│   │   │   ├── validators/
│   │   │   │   ├── user.validator.ts
│   │   │   │   └── email.validator.ts
│   │   │   │
│   │   │   └── transformers/
│   │   │       ├── user.transformer.ts
│   │   │       └── user-list.transformer.ts
│   │   │
│   │   ├── roles/
│   │   │   ├── roles.module.ts
│   │   │   ├── roles.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── roles.controller.ts
│   │   │   │   └── permissions.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── roles.service.ts
│   │   │   │   ├── permissions.service.ts
│   │   │   │   ├── permission-checker.service.ts
│   │   │   │   └── permission-inheritance.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   └── roles.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── create-role.dto.ts
│   │   │   │   ├── update-role.dto.ts
│   │   │   │   └── role-query.dto.ts
│   │   │   │
│   │   │   ├── validators/
│   │   │   │   ├── role.validator.ts
│   │   │   │   └── permission.validator.ts
│   │   │   │
│   │   │   └── constants/
│   │   │       ├── system-roles.ts
│   │   │       └── permissions.ts
│   │   │
│   │   ├── companies/
│   │   │   ├── companies.module.ts
│   │   │   ├── companies.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── companies.controller.ts
│   │   │   │   └── company-settings.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── companies.service.ts
│   │   │   │   ├── company-settings.service.ts
│   │   │   │   └── company-validation.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   └── companies.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── create-company.dto.ts
│   │   │   │   ├── update-company.dto.ts
│   │   │   │   └── company-settings.dto.ts
│   │   │   │
│   │   │   └── validators/
│   │   │       └── company.validator.ts
│   │   │
│   │   ├── departments/
│   │   │   ├── departments.module.ts
│   │   │   ├── departments.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   └── departments.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── departments.service.ts
│   │   │   │   └── department-hierarchy.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   └── departments.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── create-department.dto.ts
│   │   │   │   ├── update-department.dto.ts
│   │   │   │   └── department-query.dto.ts
│   │   │   │
│   │   │   └── validators/
│   │   │       └── department.validator.ts
│   │   │
│   │   ├── vendors/
│   │   │   ├── vendors.module.ts
│   │   │   ├── vendors.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── vendors.controller.ts
│   │   │   │   ├── vendor-contacts.controller.ts
│   │   │   │   └── vendor-import.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── vendors.service.ts
│   │   │   │   ├── vendor-contacts.service.ts
│   │   │   │   ├── vendor-validation.service.ts
│   │   │   │   ├── vendor-import.service.ts
│   │   │   │   └── vendor-export.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   ├── vendors.repository.ts
│   │   │   │   └── vendor-contacts.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── create-vendor.dto.ts
│   │   │   │   ├── update-vendor.dto.ts
│   │   │   │   ├── vendor-query.dto.ts
│   │   │   │   ├── create-contact.dto.ts
│   │   │   │   └── import-vendor.dto.ts
│   │   │   │
│   │   │   └── validators/
│   │   │       ├── vendor.validator.ts
│   │   │       └── contact.validator.ts
│   │   │
│   │   ├── gl-accounts/
│   │   │   ├── gl-accounts.module.ts
│   │   │   ├── gl-accounts.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   └── gl-accounts.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── gl-accounts.service.ts
│   │   │   │   └── gl-hierarchy.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   └── gl-accounts.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── create-gl-account.dto.ts
│   │   │   │   ├── update-gl-account.dto.ts
│   │   │   │   └── gl-account-query.dto.ts
│   │   │   │
│   │   │   └── validators/
│   │   │       └── gl-account.validator.ts
│   │   │
│   │   ├── invoices/
│   │   │   ├── invoices.module.ts
│   │   │   ├── invoices.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── invoices.controller.ts
│   │   │   │   ├── invoice-line-items.controller.ts
│   │   │   │   ├── invoice-submission.controller.ts
│   │   │   │   ├── invoice-import.controller.ts
│   │   │   │   └── invoice-export.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── invoices.service.ts
│   │   │   │   ├── invoice-line-items.service.ts
│   │   │   │   ├── invoice-submission.service.ts
│   │   │   │   ├── invoice-validation.service.ts
│   │   │   │   ├── invoice-calculation.service.ts
│   │   │   │   ├── invoice-import.service.ts
│   │   │   │   ├── invoice-export.service.ts
│   │   │   │   └── invoice-duplicate-detection.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   ├── invoices.repository.ts
│   │   │   │   └── invoice-line-items.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── create-invoice.dto.ts
│   │   │   │   ├── update-invoice.dto.ts
│   │   │   │   ├── invoice-query.dto.ts
│   │   │   │   ├── submit-invoice.dto.ts
│   │   │   │   ├── create-line-item.dto.ts
│   │   │   │   ├── update-line-item.dto.ts
│   │   │   │   └── import-invoice.dto.ts
│   │   │   │
│   │   │   ├── validators/
│   │   │   │   ├── invoice.validator.ts
│   │   │   │   ├── line-item.validator.ts
│   │   │   │   └── submission.validator.ts
│   │   │   │
│   │   │   └── transformers/
│   │   │       ├── invoice.transformer.ts
│   │   │       └── invoice-list.transformer.ts
│   │   │
│   │   ├── approvals/
│   │   │   ├── approvals.module.ts
│   │   │   ├── approvals.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── approvals.controller.ts
│   │   │   │   ├── approval-actions.controller.ts
│   │   │   │   ├── approval-delegation.controller.ts
│   │   │   │   ├── approval-escalation.controller.ts
│   │   │   │   └── approval-bulk.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── approvals.service.ts
│   │   │   │   ├── approval-chain.service.ts
│   │   │   │   ├── approval-actions.service.ts
│   │   │   │   ├── approval-delegation.service.ts
│   │   │   │   ├── approval-escalation.service.ts
│   │   │   │   ├── approval-validation.service.ts
│   │   │   │   ├── approval-notification.service.ts
│   │   │   │   └── approval-sla.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   ├── approvals.repository.ts
│   │   │   │   ├── approval-delegation.repository.ts
│   │   │   │   └── approval-escalation.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── approve-invoice.dto.ts
│   │   │   │   ├── reject-invoice.dto.ts
│   │   │   │   ├── hold-invoice.dto.ts
│   │   │   │   ├── escalate-invoice.dto.ts
│   │   │   │   ├── delegate-approval.dto.ts
│   │   │   │   ├── approval-query.dto.ts
│   │   │   │   └── bulk-approve.dto.ts
│   │   │   │
│   │   │   ├── validators/
│   │   │   │   ├── approval.validator.ts
│   │   │   │   ├── delegation.validator.ts
│   │   │   │   └── escalation.validator.ts
│   │   │   │
│   │   │   └── engines/
│   │   │       ├── approval-engine.ts
│   │   │       ├── workflow-state-machine.ts
│   │   │       ├── rule-evaluator.ts
│   │   │       ├── doa-calculator.ts
│   │   │       ├── chain-builder.ts
│   │   │       ├── escalation-scheduler.ts
│   │   │       └── sla-tracker.ts
│   │   │
│   │   ├── approval-rules/
│   │   │   ├── approval-rules.module.ts
│   │   │   ├── approval-rules.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── approval-rules.controller.ts
│   │   │   │   ├── doa-policies.controller.ts
│   │   │   │   └── auto-approval.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── approval-rules.service.ts
│   │   │   │   ├── doa-policies.service.ts
│   │   │   │   ├── auto-approval.service.ts
│   │   │   │   ├── rule-evaluation.service.ts
│   │   │   │   └── rule-testing.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   ├── approval-rules.repository.ts
│   │   │   │   └── doa-policies.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── create-rule.dto.ts
│   │   │   │   ├── update-rule.dto.ts
│   │   │   │   ├── create-doa-policy.dto.ts
│   │   │   │   ├── test-rules.dto.ts
│   │   │   │   └── calculate-chain.dto.ts
│   │   │   │
│   │   │   ├── rules/
│   │   │   │   ├── amount-based.rule.ts
│   │   │   │   ├── department-based.rule.ts
│   │   │   │   ├── vendor-based.rule.ts
│   │   │   │   ├── gl-account-based.rule.ts
│   │   │   │   ├── time-based.rule.ts
│   │   │   │   ├── duplicate-detection.rule.ts
│   │   │   │   ├── exception.rule.ts
│   │   │   │   └── auto-approval.rule.ts
│   │   │   │
│   │   │   └── constants/
│   │   │       ├── rule-types.ts
│   │   │       └── default-rules.ts
│   │   │
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── payments.controller.ts
│   │   │   │   ├── payment-items.controller.ts
│   │   │   │   ├── payment-processing.controller.ts
│   │   │   │   └── payment-export.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── payments.service.ts
│   │   │   │   ├── payment-items.service.ts
│   │   │   │   ├── payment-processing.service.ts
│   │   │   │   ├── payment-validation.service.ts
│   │   │   │   ├── payment-batch.service.ts
│   │   │   │   ├── payment-export.service.ts
│   │   │   │   └── payment-reconciliation.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   ├── payments.repository.ts
│   │   │   │   └── payment-items.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── create-payment.dto.ts
│   │   │   │   ├── update-payment.dto.ts
│   │   │   │   ├── payment-query.dto.ts
│   │   │   │   ├── process-payment.dto.ts
│   │   │   │   └── add-payment-item.dto.ts
│   │   │   │
│   │   │   └── validators/
│   │   │       ├── payment.validator.ts
│   │   │       └── payment-item.validator.ts
│   │   │
│   │   ├── attachments/
│   │   │   ├── attachments.module.ts
│   │   │   ├── attachments.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   └── attachments.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── attachments.service.ts
│   │   │   │   ├── file-storage.service.ts
│   │   │   │   ├── file-validation.service.ts
│   │   │   │   └── virus-scan.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   └── attachments.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── upload-attachment.dto.ts
│   │   │   │   └── attachment-query.dto.ts
│   │   │   │
│   │   │   └── validators/
│   │   │       └── file.validator.ts
│   │   │
│   │   ├── comments/
│   │   │   ├── comments.module.ts
│   │   │   ├── comments.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   └── comments.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   └── comments.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   └── comments.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── create-comment.dto.ts
│   │   │   │   ├── update-comment.dto.ts
│   │   │   │   └── comment-query.dto.ts
│   │   │   │
│   │   │   └── validators/
│   │   │       └── comment.validator.ts
│   │   │
│   │   ├── audit-logs/
│   │   │   ├── audit-logs.module.ts
│   │   │   ├── audit-logs.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   └── audit-logs.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── audit-logs.service.ts
│   │   │   │   ├── audit-logger.service.ts
│   │   │   │   └── audit-export.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   └── audit-logs.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── audit-log-query.dto.ts
│   │   │   │   └── create-audit-log.dto.ts
│   │   │   │
│   │   │   └── decorators/
│   │   │       └── audit.decorator.ts
│   │   │
│   │   ├── reports/
│   │   │   ├── reports.module.ts
│   │   │   ├── reports.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   ├── reports.controller.ts
│   │   │   │   ├── ap-aging.controller.ts
│   │   │   │   ├── invoice-summary.controller.ts
│   │   │   │   ├── payment-summary.controller.ts
│   │   │   │   ├── vendor-spend.controller.ts
│   │   │   │   └── approval-metrics.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── reports.service.ts
│   │   │   │   ├── ap-aging.service.ts
│   │   │   │   ├── invoice-summary.service.ts
│   │   │   │   ├── payment-summary.service.ts
│   │   │   │   ├── vendor-spend.service.ts
│   │   │   │   ├── cash-flow.service.ts
│   │   │   │   ├── gl-distribution.service.ts
│   │   │   │   ├── approval-metrics.service.ts
│   │   │   │   └── report-export.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   └── reports.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── report-query.dto.ts
│   │   │   │   ├── ap-aging-query.dto.ts
│   │   │   │   ├── date-range-query.dto.ts
│   │   │   │   └── export-report.dto.ts
│   │   │   │
│   │   │   └── generators/
│   │   │       ├── pdf.generator.ts
│   │   │       ├── excel.generator.ts
│   │   │       └── csv.generator.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   └── notifications.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── notifications.service.ts
│   │   │   │   ├── email.service.ts
│   │   │   │   ├── sms.service.ts
│   │   │   │   ├── in-app.service.ts
│   │   │   │   ├── webhook.service.ts
│   │   │   │   └── notification-preferences.service.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   ├── notifications.repository.ts
│   │   │   │   └── notification-preferences.repository.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── notification-query.dto.ts
│   │   │   │   └── notification-preferences.dto.ts
│   │   │   │
│   │   │   ├── templates/
│   │   │   │   ├── email/
│   │   │   │   │   ├── approval-request.hbs
│   │   │   │   │   ├── approval-approved.hbs
│   │   │   │   │   ├── approval-rejected.hbs
│   │   │   │   │   ├── escalation-warning.hbs
│   │   │   │   │   ├── escalation-alert.hbs
│   │   │   │   │   ├── payment-scheduled.hbs
│   │   │   │   │   └── password-reset.hbs
│   │   │   │   └── sms/
│   │   │   │       ├── approval-urgent.txt
│   │   │   │       └── escalation-critical.txt
│   │   │   │
│   │   │   └── constants/
│   │   │       └── notification-types.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.module.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   │
│   │   │   ├── controllers/
│   │   │   │   └── dashboard.controller.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── dashboard.service.ts
│   │   │   │   ├── metrics.service.ts
│   │   │   │   └── analytics.service.ts
│   │   │   │
│   │   │   └── dto/
│   │   │       └── dashboard-query.dto.ts
│   │   │
│   │   └── health/
│   │       ├── health.module.ts
│   │       ├── health.routes.ts
│   │       │
│   │       ├── controllers/
│   │       │   └── health.controller.ts
│   │       │
│   │       └── services/
│   │           └── health.service.ts
│   │
│   ├── jobs/
│   │   ├── index.ts
│   │   ├── job.processor.ts
│   │   ├── job.scheduler.ts
│   │   │
│   │   ├── queues/
│   │   │   ├── email.queue.ts
│   │   │   ├── sms.queue.ts
│   │   │   ├── notification.queue.ts
│   │   │   ├── approval-escalation.queue.ts
│   │   │   ├── payment-processing.queue.ts
│   │   │   ├── report-generation.queue.ts
│   │   │   └── audit-log.queue.ts
│   │   │
│   │   └── workers/
│   │       ├── email.worker.ts
│   │       ├── sms.worker.ts
│   │       ├── approval-escalation.worker.ts
│   │       ├── sla-checker.worker.ts
│   │       ├── payment-processor.worker.ts
│   │       ├── report-generator.worker.ts
│   │       └── cleanup.worker.ts
│   │
│   ├── events/
│   │   ├── index.ts
│   │   ├── event-emitter.ts
│   │   ├── event-bus.ts
│   │   │
│   │   ├── listeners/
│   │   │   ├── invoice-submitted.listener.ts
│   │   │   ├── invoice-approved.listener.ts
│   │   │   ├── invoice-rejected.listener.ts
│   │   │   ├── invoice-escalated.listener.ts
│   │   │   ├── payment-processed.listener.ts
│   │   │   ├── user-created.listener.ts
│   │   │   └── approval-delegated.listener.ts
│   │   │
│   │   └── events/
│   │       ├── invoice.events.ts
│   │       ├── approval.events.ts
│   │       ├── payment.events.ts
│   │       └── user.events.ts
│   │
│   ├── cache/
│   │   ├── index.ts
│   │   ├── redis.client.ts
│   │   ├── cache.service.ts
│   │   ├── cache.decorator.ts
│   │   │
│   │   └── strategies/
│   │       ├── user-cache.strategy.ts
│   │       ├── role-cache.strategy.ts
│   │       ├── doa-cache.strategy.ts
│   │       └── approval-chain-cache.strategy.ts
│   │
│   ├── logger/
│   │   ├── index.ts
│   │   ├── logger.service.ts
│   │   ├── logger.middleware.ts
│   │   │
│   │   └── transports/
│   │       ├── console.transport.ts
│   │       ├── file.transport.ts
│   │       └── cloudwatch.transport.ts
│   │
│   ├── validators/
│   │   ├── index.ts
│   │   ├── validation-pipe.ts
│   │   │
│   │   └── schemas/
│   │       ├── common.schema.ts
│   │       ├── invoice.schema.ts
│   │       ├── payment.schema.ts
│   │       ├── approval.schema.ts
│   │       └── user.schema.ts
│   │
│   └── routes/
│       ├── index.ts
│       ├── api.routes.ts
│       └── v1.routes.ts
│
├── tests/
│   ├── setup.ts
│   ├── teardown.ts
│   ├── helpers/
│   │   ├── test-db.helper.ts
│   │   ├── auth.helper.ts
│   │   ├── factory.helper.ts
│   │   └── mock.helper.ts
│   │
│   ├── unit/
│   │   ├── auth/
│   │   │   ├── auth.service.spec.ts
│   │   │   ├── token.service.spec.ts
│   │   │   └── password.service.spec.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.service.spec.ts
│   │   │   └── user-roles.service.spec.ts
│   │   │
│   │   ├── invoices/
│   │   │   ├── invoices.service.spec.ts
│   │   │   ├── invoice-validation.service.spec.ts
│   │   │   └── invoice-calculation.service.spec.ts
│   │   │
│   │   ├── approvals/
│   │   │   ├── approval-engine.spec.ts
│   │   │   ├── approval-chain.service.spec.ts
│   │   │   ├── doa-calculator.spec.ts
│   │   │   ├── rule-evaluator.spec.ts
│   │   │   └── escalation-scheduler.spec.ts
│   │   │
│   │   └── payments/
│   │       ├── payments.service.spec.ts
│   │       └── payment-processing.service.spec.ts
│   │
│   ├── integration/
│   │   ├── auth/
│   │   │   ├── login.spec.ts
│   │   │   ├── logout.spec.ts
│   │   │   └── refresh-token.spec.ts
│   │   │
│   │   ├── invoices/
│   │   │   ├── create-invoice.spec.ts
│   │   │   ├── submit-invoice.spec.ts
│   │   │   └── invoice-workflow.spec.ts
│   │   │
│   │   ├── approvals/
│   │   │   ├── approve-invoice.spec.ts
│   │   │   ├── reject-invoice.spec.ts
│   │   │   ├── delegate-approval.spec.ts
│   │   │   ├── escalate-approval.spec.ts
│   │   │   └── approval-workflow.spec.ts
│   │   │
│   │   └── payments/
│   │       ├── create-payment.spec.ts
│   │       └── process-payment.spec.ts
│   │
│   ├── e2e/
│   │   ├── invoice-lifecycle.spec.ts
│   │   ├── approval-workflow.spec.ts
│   │   ├── payment-workflow.spec.ts
│   │   └── user-management.spec.ts
│   │
│   └── fixtures/
│       ├── companies.fixture.ts
│       ├── users.fixture.ts
│       ├── vendors.fixture.ts
│       ├── invoices.fixture.ts
│       ├── approvals.fixture.ts
│       └── payments.fixture.ts
│
├── scripts/
│   ├── setup-dev.sh
│   ├── setup-test.sh
│   ├── migrate.sh
│   ├── seed.sh
│   ├── reset-db.sh
│   ├── generate-prisma.sh
│   └── create-admin.ts
│
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── TESTING.md
│   └── TROUBLESHOOTING.md
│
└── storage/
    ├── uploads/
    │   ├── invoices/
    │   └── temp/
    ├── exports/
    │   ├── reports/
    │   └── data/
    └── logs/
        ├── app.log
        ├── error.log
        └── access.log
```

## Module Dependencies

```
auth
  └─> users, roles

users
  └─> roles, departments, companies

roles
  └─> companies

companies
  (no dependencies)

departments
  └─> companies, users

vendors
  └─> companies

gl-accounts
  └─> companies

invoices
  └─> companies, vendors, departments, gl-accounts, users

approvals
  └─> invoices, users, roles, approval-rules

approval-rules
  └─> companies, roles

payments
  └─> companies, invoices

attachments
  └─> invoices, users

comments
  └─> invoices, users

audit-logs
  └─> companies, users

reports
  └─> companies, invoices, payments, vendors, approvals

notifications
  └─> users

dashboard
  └─> all modules

health
  (no dependencies)
```

## Key Architectural Patterns

### 1. Layered Architecture
```
Controllers (HTTP Layer)
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
Prisma (ORM)
    ↓
PostgreSQL (Database)
```

### 2. Dependency Injection
- Services injected into controllers
- Repositories injected into services
- Middleware composed in routes

### 3. Module Pattern
- Each business domain is a self-contained module
- Modules export only their public interfaces
- Internal implementation hidden

### 4. Repository Pattern
- Data access abstracted from business logic
- Testable with mock repositories
- Centralized query logic

### 5. DTO Pattern
- Request validation at controller level
- Type-safe data transfer
- Transformation between layers

### 6. Guard Pattern
- Authorization checks before route handlers
- Composable security layers
- Reusable across routes

### 7. Event-Driven Architecture
- Domain events for side effects
- Decoupled notification system
- Async processing with queues

### 8. Service Layer Pattern
- Business logic encapsulation
- Transaction management
- Cross-cutting concerns
