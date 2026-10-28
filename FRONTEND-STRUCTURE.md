# AP Command Centre - React Frontend Architecture

```
ap-command-centre-frontend/
│
├── .env.example
├── .env.local
├── .env.development
├── .env.production
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── tsconfig.json
├── package.json
├── package-lock.json
├── README.md
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
│
├── public/
│   ├── favicon.ico
│   ├── logo.png
│   ├── robots.txt
│   └── manifest.json
│
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── vite-env.d.ts
    │
    ├── config/
    │   ├── index.ts
    │   ├── api.config.ts
    │   ├── auth.config.ts
    │   ├── theme.config.ts
    │   ├── routes.config.ts
    │   └── constants.ts
    │
    ├── types/
    │   ├── index.ts
    │   ├── api.types.ts
    │   ├── auth.types.ts
    │   ├── user.types.ts
    │   ├── role.types.ts
    │   ├── company.types.ts
    │   ├── department.types.ts
    │   ├── vendor.types.ts
    │   ├── gl-account.types.ts
    │   ├── invoice.types.ts
    │   ├── approval.types.ts
    │   ├── payment.types.ts
    │   ├── attachment.types.ts
    │   ├── comment.types.ts
    │   ├── notification.types.ts
    │   ├── report.types.ts
    │   └── common.types.ts
    │
    ├── routes/
    │   ├── index.tsx
    │   ├── AppRoutes.tsx
    │   ├── PrivateRoute.tsx
    │   ├── PublicRoute.tsx
    │   ├── RoleBasedRoute.tsx
    │   ├── PermissionRoute.tsx
    │   └── route-guards.tsx
    │
    ├── layouts/
    │   ├── index.ts
    │   │
    │   ├── AuthLayout/
    │   │   ├── AuthLayout.tsx
    │   │   ├── AuthLayout.styles.ts
    │   │   └── index.ts
    │   │
    │   ├── DashboardLayout/
    │   │   ├── DashboardLayout.tsx
    │   │   ├── DashboardLayout.styles.ts
    │   │   ├── Header.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── Footer.tsx
    │   │   └── index.ts
    │   │
    │   ├── MinimalLayout/
    │   │   ├── MinimalLayout.tsx
    │   │   └── index.ts
    │   │
    │   └── PrintLayout/
    │       ├── PrintLayout.tsx
    │       └── index.ts
    │
    ├── components/
    │   │
    │   ├── sidebar/
    │   │   ├── Sidebar.tsx
    │   │   ├── SidebarMenu.tsx
    │   │   ├── SidebarMenuItem.tsx
    │   │   ├── SidebarSubmenu.tsx
    │   │   ├── SidebarSearch.tsx
    │   │   ├── SidebarUserProfile.tsx
    │   │   ├── sidebar.config.ts
    │   │   └── index.ts
    │   │
    │   ├── header/
    │   │   ├── Header.tsx
    │   │   ├── Breadcrumbs.tsx
    │   │   ├── NotificationBell.tsx
    │   │   ├── UserMenu.tsx
    │   │   ├── CompanySwitcher.tsx
    │   │   ├── QuickActions.tsx
    │   │   └── index.ts
    │   │
    │   ├── common/
    │   │   ├── Button/
    │   │   │   ├── Button.tsx
    │   │   │   ├── Button.styles.ts
    │   │   │   ├── IconButton.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Input/
    │   │   │   ├── Input.tsx
    │   │   │   ├── TextInput.tsx
    │   │   │   ├── NumberInput.tsx
    │   │   │   ├── DateInput.tsx
    │   │   │   ├── SearchInput.tsx
    │   │   │   ├── TextArea.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Select/
    │   │   │   ├── Select.tsx
    │   │   │   ├── MultiSelect.tsx
    │   │   │   ├── AsyncSelect.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Checkbox/
    │   │   │   ├── Checkbox.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Radio/
    │   │   │   ├── Radio.tsx
    │   │   │   ├── RadioGroup.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Switch/
    │   │   │   ├── Switch.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Modal/
    │   │   │   ├── Modal.tsx
    │   │   │   ├── ConfirmModal.tsx
    │   │   │   ├── FormModal.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Drawer/
    │   │   │   ├── Drawer.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Card/
    │   │   │   ├── Card.tsx
    │   │   │   ├── Card.styles.ts
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Badge/
    │   │   │   ├── Badge.tsx
    │   │   │   ├── StatusBadge.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Tag/
    │   │   │   ├── Tag.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Tooltip/
    │   │   │   ├── Tooltip.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Dropdown/
    │   │   │   ├── Dropdown.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Tabs/
    │   │   │   ├── Tabs.tsx
    │   │   │   ├── Tab.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Accordion/
    │   │   │   ├── Accordion.tsx
    │   │   │   ├── AccordionItem.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Alert/
    │   │   │   ├── Alert.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Toast/
    │   │   │   ├── Toast.tsx
    │   │   │   ├── ToastContainer.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Loader/
    │   │   │   ├── Loader.tsx
    │   │   │   ├── Spinner.tsx
    │   │   │   ├── Skeleton.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Pagination/
    │   │   │   ├── Pagination.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Progress/
    │   │   │   ├── ProgressBar.tsx
    │   │   │   ├── ProgressCircle.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Avatar/
    │   │   │   ├── Avatar.tsx
    │   │   │   ├── AvatarGroup.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Divider/
    │   │   │   ├── Divider.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── EmptyState/
    │   │   │   ├── EmptyState.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── ErrorBoundary/
    │   │   │   ├── ErrorBoundary.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── Portal/
    │   │       ├── Portal.tsx
    │   │       └── index.ts
    │   │
    │   ├── forms/
    │   │   ├── Form/
    │   │   │   ├── Form.tsx
    │   │   │   ├── FormField.tsx
    │   │   │   ├── FormError.tsx
    │   │   │   ├── FormLabel.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── FileUpload/
    │   │   │   ├── FileUpload.tsx
    │   │   │   ├── FileUploadDropzone.tsx
    │   │   │   ├── FileList.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── DatePicker/
    │   │   │   ├── DatePicker.tsx
    │   │   │   ├── DateRangePicker.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── CurrencyInput/
    │   │   │   ├── CurrencyInput.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── RichTextEditor/
    │   │       ├── RichTextEditor.tsx
    │   │       └── index.ts
    │   │
    │   ├── tables/
    │   │   ├── DataTable/
    │   │   │   ├── DataTable.tsx
    │   │   │   ├── DataTableHeader.tsx
    │   │   │   ├── DataTableBody.tsx
    │   │   │   ├── DataTableRow.tsx
    │   │   │   ├── DataTableCell.tsx
    │   │   │   ├── DataTablePagination.tsx
    │   │   │   ├── DataTableFilters.tsx
    │   │   │   ├── DataTableSearch.tsx
    │   │   │   ├── DataTableActions.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── TableSkeleton/
    │   │   │   ├── TableSkeleton.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── ExportButton/
    │   │       ├── ExportButton.tsx
    │   │       └── index.ts
    │   │
    │   ├── charts/
    │   │   ├── BarChart/
    │   │   │   ├── BarChart.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── LineChart/
    │   │   │   ├── LineChart.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── PieChart/
    │   │   │   ├── PieChart.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── DonutChart/
    │   │   │   ├── DonutChart.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── AreaChart/
    │   │       ├── AreaChart.tsx
    │   │       └── index.ts
    │   │
    │   ├── widgets/
    │   │   ├── StatCard/
    │   │   │   ├── StatCard.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── MetricCard/
    │   │   │   ├── MetricCard.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── ActivityFeed/
    │   │   │   ├── ActivityFeed.tsx
    │   │   │   ├── ActivityItem.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Timeline/
    │   │   │   ├── Timeline.tsx
    │   │   │   ├── TimelineItem.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── NotificationList/
    │   │       ├── NotificationList.tsx
    │   │       ├── NotificationItem.tsx
    │   │       └── index.ts
    │   │
    │   ├── invoice/
    │   │   ├── InvoiceCard/
    │   │   │   ├── InvoiceCard.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── InvoiceStatusBadge/
    │   │   │   ├── InvoiceStatusBadge.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── InvoiceForm/
    │   │   │   ├── InvoiceForm.tsx
    │   │   │   ├── InvoiceDetails.tsx
    │   │   │   ├── LineItemsTable.tsx
    │   │   │   ├── LineItemRow.tsx
    │   │   │   ├── InvoiceSummary.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── InvoicePreview/
    │   │   │   ├── InvoicePreview.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── InvoiceTimeline/
    │   │   │   ├── InvoiceTimeline.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── InvoiceAttachments/
    │   │       ├── InvoiceAttachments.tsx
    │   │       ├── AttachmentList.tsx
    │   │       ├── AttachmentItem.tsx
    │   │       └── index.ts
    │   │
    │   ├── approval/
    │   │   ├── ApprovalCard/
    │   │   │   ├── ApprovalCard.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── ApprovalChain/
    │   │   │   ├── ApprovalChain.tsx
    │   │   │   ├── ApprovalLevel.tsx
    │   │   │   ├── ApprovalStep.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── ApprovalHistory/
    │   │   │   ├── ApprovalHistory.tsx
    │   │   │   ├── ApprovalHistoryItem.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── ApprovalActions/
    │   │   │   ├── ApprovalActions.tsx
    │   │   │   ├── ApproveButton.tsx
    │   │   │   ├── RejectButton.tsx
    │   │   │   ├── HoldButton.tsx
    │   │   │   ├── EscalateButton.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── ApprovalModal/
    │   │   │   ├── ApproveModal.tsx
    │   │   │   ├── RejectModal.tsx
    │   │   │   ├── HoldModal.tsx
    │   │   │   ├── EscalateModal.tsx
    │   │   │   ├── DelegateModal.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── ApprovalStatusBadge/
    │   │   │   ├── ApprovalStatusBadge.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── PendingApprovalsList/
    │   │       ├── PendingApprovalsList.tsx
    │   │       └── index.ts
    │   │
    │   ├── payment/
    │   │   ├── PaymentCard/
    │   │   │   ├── PaymentCard.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── PaymentForm/
    │   │   │   ├── PaymentForm.tsx
    │   │   │   ├── PaymentItemsTable.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── PaymentStatusBadge/
    │   │   │   ├── PaymentStatusBadge.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── PaymentBatch/
    │   │       ├── PaymentBatch.tsx
    │   │       ├── PaymentBatchSummary.tsx
    │   │       └── index.ts
    │   │
    │   ├── vendor/
    │   │   ├── VendorCard/
    │   │   │   ├── VendorCard.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── VendorForm/
    │   │   │   ├── VendorForm.tsx
    │   │   │   ├── VendorDetails.tsx
    │   │   │   ├── VendorBankDetails.tsx
    │   │   │   ├── VendorContacts.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── VendorSelect/
    │   │   │   ├── VendorSelect.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── VendorSpendChart/
    │   │       ├── VendorSpendChart.tsx
    │   │       └── index.ts
    │   │
    │   ├── user/
    │   │   ├── UserCard/
    │   │   │   ├── UserCard.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── UserForm/
    │   │   │   ├── UserForm.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── UserAvatar/
    │   │   │   ├── UserAvatar.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── RoleAssignment/
    │   │       ├── RoleAssignment.tsx
    │   │       └── index.ts
    │   │
    │   ├── comments/
    │   │   ├── CommentList/
    │   │   │   ├── CommentList.tsx
    │   │   │   ├── CommentItem.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── CommentForm/
    │   │   │   ├── CommentForm.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── CommentBox/
    │   │       ├── CommentBox.tsx
    │   │       └── index.ts
    │   │
    │   ├── reports/
    │   │   ├── ReportFilters/
    │   │   │   ├── ReportFilters.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── ReportExport/
    │   │   │   ├── ReportExport.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── ReportSummary/
    │   │       ├── ReportSummary.tsx
    │   │       └── index.ts
    │   │
    │   └── rbac/
    │       ├── ProtectedComponent/
    │       │   ├── ProtectedComponent.tsx
    │       │   └── index.ts
    │       │
    │       ├── PermissionGate/
    │       │   ├── PermissionGate.tsx
    │       │   └── index.ts
    │       │
    │       ├── RoleGate/
    │       │   ├── RoleGate.tsx
    │       │   └── index.ts
    │       │
    │       └── Can/
    │           ├── Can.tsx
    │           └── index.ts
    │
    ├── pages/
    │   │
    │   ├── auth/
    │   │   ├── Login/
    │   │   │   ├── LoginPage.tsx
    │   │   │   ├── LoginForm.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── Register/
    │   │   │   ├── RegisterPage.tsx
    │   │   │   ├── RegisterForm.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── ForgotPassword/
    │   │   │   ├── ForgotPasswordPage.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── ResetPassword/
    │   │   │   ├── ResetPasswordPage.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── VerifyEmail/
    │   │       ├── VerifyEmailPage.tsx
    │   │       └── index.ts
    │   │
    │   ├── dashboard/
    │   │   ├── DashboardPage.tsx
    │   │   ├── DashboardOverview.tsx
    │   │   ├── DashboardMetrics.tsx
    │   │   ├── DashboardCharts.tsx
    │   │   └── index.ts
    │   │
    │   ├── invoices/
    │   │   ├── InvoiceListPage.tsx
    │   │   ├── InvoiceCreatePage.tsx
    │   │   ├── InvoiceEditPage.tsx
    │   │   ├── InvoiceDetailPage.tsx
    │   │   ├── InvoiceImportPage.tsx
    │   │   └── index.ts
    │   │
    │   ├── approvals/
    │   │   ├── ApprovalListPage.tsx
    │   │   ├── MyApprovalsPage.tsx
    │   │   ├── ApprovalDetailPage.tsx
    │   │   ├── EscalationsPage.tsx
    │   │   ├── DelegationsPage.tsx
    │   │   └── index.ts
    │   │
    │   ├── payments/
    │   │   ├── PaymentListPage.tsx
    │   │   ├── PaymentCreatePage.tsx
    │   │   ├── PaymentDetailPage.tsx
    │   │   ├── PaymentBatchPage.tsx
    │   │   └── index.ts
    │   │
    │   ├── vendors/
    │   │   ├── VendorListPage.tsx
    │   │   ├── VendorCreatePage.tsx
    │   │   ├── VendorEditPage.tsx
    │   │   ├── VendorDetailPage.tsx
    │   │   ├── VendorImportPage.tsx
    │   │   └── index.ts
    │   │
    │   ├── reports/
    │   │   ├── ReportsPage.tsx
    │   │   ├── APAgingReportPage.tsx
    │   │   ├── InvoiceSummaryReportPage.tsx
    │   │   ├── PaymentSummaryReportPage.tsx
    │   │   ├── VendorSpendReportPage.tsx
    │   │   ├── CashFlowReportPage.tsx
    │   │   ├── GLDistributionReportPage.tsx
    │   │   ├── ApprovalMetricsReportPage.tsx
    │   │   └── index.ts
    │   │
    │   ├── settings/
    │   │   ├── SettingsPage.tsx
    │   │   │
    │   │   ├── company/
    │   │   │   ├── CompanySettingsPage.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── users/
    │   │   │   ├── UserManagementPage.tsx
    │   │   │   ├── UserCreatePage.tsx
    │   │   │   ├── UserEditPage.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── roles/
    │   │   │   ├── RoleManagementPage.tsx
    │   │   │   ├── RoleCreatePage.tsx
    │   │   │   ├── RoleEditPage.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── departments/
    │   │   │   ├── DepartmentManagementPage.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── gl-accounts/
    │   │   │   ├── GLAccountManagementPage.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── approval-workflows/
    │   │   │   ├── ApprovalWorkflowsPage.tsx
    │   │   │   ├── DOAPoliciesPage.tsx
    │   │   │   ├── ApprovalRulesPage.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   ├── notifications/
    │   │   │   ├── NotificationSettingsPage.tsx
    │   │   │   └── index.ts
    │   │   │
    │   │   └── profile/
    │   │       ├── ProfilePage.tsx
    │   │       ├── ProfileEditPage.tsx
    │   │       ├── ChangePasswordPage.tsx
    │   │       └── index.ts
    │   │
    │   ├── audit-logs/
    │   │   ├── AuditLogsPage.tsx
    │   │   └── index.ts
    │   │
    │   ├── notifications/
    │   │   ├── NotificationsPage.tsx
    │   │   └── index.ts
    │   │
    │   ├── error/
    │   │   ├── NotFoundPage.tsx
    │   │   ├── ForbiddenPage.tsx
    │   │   ├── ServerErrorPage.tsx
    │   │   └── index.ts
    │   │
    │   └── help/
    │       ├── HelpPage.tsx
    │       └── index.ts
    │
    ├── hooks/
    │   ├── index.ts
    │   │
    │   ├── auth/
    │   │   ├── useAuth.ts
    │   │   ├── useUser.ts
    │   │   ├── usePermissions.ts
    │   │   ├── useRoles.ts
    │   │   └── index.ts
    │   │
    │   ├── api/
    │   │   ├── useQuery.ts
    │   │   ├── useMutation.ts
    │   │   ├── useInfiniteQuery.ts
    │   │   ├── usePagination.ts
    │   │   └── index.ts
    │   │
    │   ├── invoice/
    │   │   ├── useInvoices.ts
    │   │   ├── useInvoice.ts
    │   │   ├── useCreateInvoice.ts
    │   │   ├── useUpdateInvoice.ts
    │   │   ├── useDeleteInvoice.ts
    │   │   ├── useSubmitInvoice.ts
    │   │   ├── useInvoiceValidation.ts
    │   │   └── index.ts
    │   │
    │   ├── approval/
    │   │   ├── useApprovals.ts
    │   │   ├── usePendingApprovals.ts
    │   │   ├── useApproveInvoice.ts
    │   │   ├── useRejectInvoice.ts
    │   │   ├── useEscalateInvoice.ts
    │   │   ├── useDelegateApproval.ts
    │   │   ├── useApprovalChain.ts
    │   │   └── index.ts
    │   │
    │   ├── payment/
    │   │   ├── usePayments.ts
    │   │   ├── usePayment.ts
    │   │   ├── useCreatePayment.ts
    │   │   ├── useProcessPayment.ts
    │   │   └── index.ts
    │   │
    │   ├── vendor/
    │   │   ├── useVendors.ts
    │   │   ├── useVendor.ts
    │   │   ├── useCreateVendor.ts
    │   │   ├── useUpdateVendor.ts
    │   │   └── index.ts
    │   │
    │   ├── user/
    │   │   ├── useUsers.ts
    │   │   ├── useCreateUser.ts
    │   │   ├── useUpdateUser.ts
    │   │   └── index.ts
    │   │
    │   ├── notification/
    │   │   ├── useNotifications.ts
    │   │   ├── useMarkAsRead.ts
    │   │   └── index.ts
    │   │
    │   ├── report/
    │   │   ├── useAPAging.ts
    │   │   ├── useInvoiceSummary.ts
    │   │   ├── usePaymentSummary.ts
    │   │   ├── useVendorSpend.ts
    │   │   └── index.ts
    │   │
    │   ├── form/
    │   │   ├── useForm.ts
    │   │   ├── useFormValidation.ts
    │   │   ├── useFieldArray.ts
    │   │   └── index.ts
    │   │
    │   ├── ui/
    │   │   ├── useModal.ts
    │   │   ├── useDrawer.ts
    │   │   ├── useToast.ts
    │   │   ├── useDisclosure.ts
    │   │   ├── useToggle.ts
    │   │   ├── useDebounce.ts
    │   │   ├── useThrottle.ts
    │   │   ├── useLocalStorage.ts
    │   │   ├── useSessionStorage.ts
    │   │   ├── useMediaQuery.ts
    │   │   ├── useClickOutside.ts
    │   │   ├── useKeyPress.ts
    │   │   ├── useCopyToClipboard.ts
    │   │   └── index.ts
    │   │
    │   ├── table/
    │   │   ├── useTable.ts
    │   │   ├── useSorting.ts
    │   │   ├── useFilters.ts
    │   │   ├── useRowSelection.ts
    │   │   └── index.ts
    │   │
    │   └── common/
    │       ├── useAsync.ts
    │       ├── useFetch.ts
    │       ├── useWindowSize.ts
    │       ├── useScrollPosition.ts
    │       ├── useInterval.ts
    │       ├── useTimeout.ts
    │       └── index.ts
    │
    ├── services/
    │   ├── index.ts
    │   │
    │   ├── api/
    │   │   ├── client.ts
    │   │   ├── interceptors.ts
    │   │   ├── error-handler.ts
    │   │   └── index.ts
    │   │
    │   ├── auth/
    │   │   ├── auth.service.ts
    │   │   ├── token.service.ts
    │   │   └── index.ts
    │   │
    │   ├── users/
    │   │   ├── users.service.ts
    │   │   └── index.ts
    │   │
    │   ├── roles/
    │   │   ├── roles.service.ts
    │   │   └── index.ts
    │   │
    │   ├── companies/
    │   │   ├── companies.service.ts
    │   │   └── index.ts
    │   │
    │   ├── departments/
    │   │   ├── departments.service.ts
    │   │   └── index.ts
    │   │
    │   ├── vendors/
    │   │   ├── vendors.service.ts
    │   │   └── index.ts
    │   │
    │   ├── gl-accounts/
    │   │   ├── gl-accounts.service.ts
    │   │   └── index.ts
    │   │
    │   ├── invoices/
    │   │   ├── invoices.service.ts
    │   │   ├── line-items.service.ts
    │   │   └── index.ts
    │   │
    │   ├── approvals/
    │   │   ├── approvals.service.ts
    │   │   ├── approval-actions.service.ts
    │   │   ├── delegation.service.ts
    │   │   ├── escalation.service.ts
    │   │   └── index.ts
    │   │
    │   ├── payments/
    │   │   ├── payments.service.ts
    │   │   └── index.ts
    │   │
    │   ├── attachments/
    │   │   ├── attachments.service.ts
    │   │   └── index.ts
    │   │
    │   ├── comments/
    │   │   ├── comments.service.ts
    │   │   └── index.ts
    │   │
    │   ├── notifications/
    │   │   ├── notifications.service.ts
    │   │   └── index.ts
    │   │
    │   ├── reports/
    │   │   ├── reports.service.ts
    │   │   └── index.ts
    │   │
    │   ├── audit-logs/
    │   │   ├── audit-logs.service.ts
    │   │   └── index.ts
    │   │
    │   └── dashboard/
    │       ├── dashboard.service.ts
    │       └── index.ts
    │
    ├── store/
    │   ├── index.ts
    │   ├── store.ts
    │   │
    │   ├── slices/
    │   │   ├── auth.slice.ts
    │   │   ├── user.slice.ts
    │   │   ├── company.slice.ts
    │   │   ├── invoice.slice.ts
    │   │   ├── approval.slice.ts
    │   │   ├── payment.slice.ts
    │   │   ├── vendor.slice.ts
    │   │   ├── notification.slice.ts
    │   │   ├── ui.slice.ts
    │   │   └── index.ts
    │   │
    │   ├── actions/
    │   │   ├── auth.actions.ts
    │   │   ├── invoice.actions.ts
    │   │   ├── approval.actions.ts
    │   │   ├── payment.actions.ts
    │   │   └── index.ts
    │   │
    │   ├── selectors/
    │   │   ├── auth.selectors.ts
    │   │   ├── invoice.selectors.ts
    │   │   ├── approval.selectors.ts
    │   │   ├── payment.selectors.ts
    │   │   └── index.ts
    │   │
    │   └── middleware/
    │       ├── api.middleware.ts
    │       ├── auth.middleware.ts
    │       ├── logger.middleware.ts
    │       └── index.ts
    │
    ├── context/
    │   ├── AuthContext.tsx
    │   ├── ThemeContext.tsx
    │   ├── NotificationContext.tsx
    │   ├── ModalContext.tsx
    │   ├── ToastContext.tsx
    │   └── index.ts
    │
    ├── utils/
    │   ├── index.ts
    │   ├── date.util.ts
    │   ├── currency.util.ts
    │   ├── number.util.ts
    │   ├── string.util.ts
    │   ├── validation.util.ts
    │   ├── formatting.util.ts
    │   ├── status.util.ts
    │   ├── color.util.ts
    │   ├── permission.util.ts
    │   ├── file.util.ts
    │   ├── export.util.ts
    │   └── error.util.ts
    │
    ├── lib/
    │   ├── axios.ts
    │   ├── react-query.ts
    │   ├── react-hook-form.ts
    │   ├── yup.ts
    │   ├── date-fns.ts
    │   └── recharts.ts
    │
    ├── constants/
    │   ├── index.ts
    │   ├── api-endpoints.ts
    │   ├── invoice-statuses.ts
    │   ├── approval-statuses.ts
    │   ├── payment-statuses.ts
    │   ├── payment-methods.ts
    │   ├── currencies.ts
    │   ├── date-formats.ts
    │   ├── permissions.ts
    │   ├── roles.ts
    │   └── colors.ts
    │
    ├── styles/
    │   ├── index.css
    │   ├── global.css
    │   ├── variables.css
    │   ├── utilities.css
    │   ├── animations.css
    │   └── print.css
    │
    ├── assets/
    │   ├── images/
    │   │   ├── logo.svg
    │   │   ├── logo-dark.svg
    │   │   ├── empty-state.svg
    │   │   └── error-state.svg
    │   │
    │   ├── icons/
    │   │   └── (icon files)
    │   │
    │   └── fonts/
    │       └── (font files)
    │
    └── __tests__/
        ├── setup.ts
        ├── test-utils.tsx
        │
        ├── components/
        │   ├── Button.test.tsx
        │   ├── DataTable.test.tsx
        │   ├── InvoiceForm.test.tsx
        │   └── ApprovalActions.test.tsx
        │
        ├── hooks/
        │   ├── useAuth.test.ts
        │   ├── useInvoices.test.ts
        │   └── useApprovals.test.ts
        │
        ├── pages/
        │   ├── Login.test.tsx
        │   ├── InvoiceList.test.tsx
        │   └── Dashboard.test.tsx
        │
        ├── services/
        │   ├── auth.service.test.ts
        │   ├── invoices.service.test.ts
        │   └── approvals.service.test.ts
        │
        └── utils/
            ├── date.util.test.ts
            ├── currency.util.test.ts
            └── validation.util.test.ts
```

## Route Structure

```
Public Routes:
  /login
  /register
  /forgot-password
  /reset-password
  /verify-email

Private Routes (Authenticated):
  /
  /dashboard

  /invoices
  /invoices/create
  /invoices/:id
  /invoices/:id/edit
  /invoices/import

  /approvals
  /approvals/my-approvals
  /approvals/:id
  /approvals/escalations
  /approvals/delegations

  /payments
  /payments/create
  /payments/:id
  /payments/batch

  /vendors
  /vendors/create
  /vendors/:id
  /vendors/:id/edit
  /vendors/import

  /reports
  /reports/ap-aging
  /reports/invoice-summary
  /reports/payment-summary
  /reports/vendor-spend
  /reports/cash-flow
  /reports/gl-distribution
  /reports/approval-metrics

  /settings
  /settings/company
  /settings/users
  /settings/users/create
  /settings/users/:id/edit
  /settings/roles
  /settings/roles/create
  /settings/roles/:id/edit
  /settings/departments
  /settings/gl-accounts
  /settings/approval-workflows
  /settings/approval-workflows/doa-policies
  /settings/approval-workflows/rules
  /settings/notifications
  /settings/profile
  /settings/profile/edit
  /settings/profile/change-password

  /audit-logs
  /notifications
  /help

Error Routes:
  /404
  /403
  /500
```

## State Management Structure

```
Redux Store Structure:

store/
  auth:
    user: User | null
    token: string | null
    isAuthenticated: boolean
    permissions: string[]
    roles: string[]
    loading: boolean

  company:
    currentCompany: Company | null
    companies: Company[]

  ui:
    sidebarOpen: boolean
    theme: 'light' | 'dark'
    notifications: Notification[]

  invoice:
    invoices: Invoice[]
    currentInvoice: Invoice | null
    filters: InvoiceFilters
    pagination: Pagination
    loading: boolean

  approval:
    pendingApprovals: Approval[]
    myApprovals: Approval[]
    escalations: Escalation[]
    loading: boolean

  payment:
    payments: Payment[]
    currentPayment: Payment | null
    loading: boolean

  vendor:
    vendors: Vendor[]
    currentVendor: Vendor | null
    loading: boolean

  notification:
    notifications: Notification[]
    unreadCount: number
```

## Component Hierarchy

```
App
├─ AuthLayout
│  ├─ Login
│  ├─ Register
│  └─ ForgotPassword
│
└─ DashboardLayout
   ├─ Header
   │  ├─ Breadcrumbs
   │  ├─ NotificationBell
   │  ├─ CompanySwitcher
   │  └─ UserMenu
   │
   ├─ Sidebar
   │  ├─ SidebarMenu
   │  │  ├─ Dashboard
   │  │  ├─ Invoices
   │  │  ├─ Approvals
   │  │  ├─ Payments
   │  │  ├─ Vendors
   │  │  ├─ Reports
   │  │  └─ Settings
   │  └─ SidebarUserProfile
   │
   └─ Content
      ├─ Dashboard
      ├─ InvoiceList
      │  └─ DataTable
      │     ├─ TableHeader
      │     ├─ TableBody
      │     └─ TablePagination
      │
      ├─ InvoiceDetail
      │  ├─ InvoiceCard
      │  ├─ LineItemsTable
      │  ├─ ApprovalChain
      │  ├─ InvoiceTimeline
      │  ├─ InvoiceAttachments
      │  └─ CommentList
      │
      ├─ MyApprovals
      │  └─ PendingApprovalsList
      │     └─ ApprovalCard
      │        └─ ApprovalActions
      │
      └─ Reports
         ├─ ReportFilters
         ├─ ReportChart
         └─ ReportExport
```

## Key Libraries & Tools

```
Core:
- React 18
- TypeScript
- Vite

Routing:
- React Router v6

State Management:
- Redux Toolkit
- React Query (TanStack Query)

Forms:
- React Hook Form
- Yup validation

UI/Styling:
- Tailwind CSS
- Headless UI
- Radix UI

Data Fetching:
- Axios
- React Query

Charts:
- Recharts / Chart.js

Date/Time:
- date-fns

Tables:
- TanStack Table (React Table)

File Upload:
- React Dropzone

Rich Text:
- Tiptap / Slate

Testing:
- Vitest
- React Testing Library
- MSW (Mock Service Worker)

Build:
- Vite
```

## RBAC Integration

```
Permission-Based Rendering:

<PermissionGate permission="invoices:create">
  <Button>Create Invoice</Button>
</PermissionGate>

<RoleGate roles={['admin', 'ap_manager']}>
  <DeleteButton />
</RoleGate>

<Can do="approve" on="invoice" amount={invoice.amount}>
  <ApproveButton />
</Can>

Route Protection:

<PermissionRoute 
  path="/invoices/create" 
  permission="invoices:create"
  component={InvoiceCreatePage}
/>

<RoleBasedRoute 
  path="/settings/users" 
  roles={['admin', 'company_admin']}
  component={UserManagementPage}
/>

Hook-Based:

const { hasPermission } = usePermissions();
const { hasRole } = useRoles();
const canApprove = hasPermission('invoices:approve:level1');
const isAdmin = hasRole('admin');
```
