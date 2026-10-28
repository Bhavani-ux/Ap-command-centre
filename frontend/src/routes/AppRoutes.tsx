import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { RoleBasedRoute } from './RoleBasedRoute';

// Layouts
import { AuthLayout } from '../layouts/AuthLayout/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout/DashboardLayout';

// Auth Pages
import { LoginPageWithRoles as LoginPage } from '../pages/auth/Login/LoginPageWithRoles';
import { MicrosoftCallback } from '../pages/auth/MicrosoftCallback';

// Dashboard Pages
import { DashboardPage } from '../pages/dashboard/DashboardPage';

// Hub Pages
import { HubSelectorPage } from '../pages/hubs/HubSelectorPage';
import { APDashboardPageEnhanced as APDashboardPage } from '../pages/ap-hub/APDashboardPageEnhanced';
import { EmailIntakePageFunctional as EmailIntakePage } from '../pages/ap-hub/EmailIntakePageFunctional';
import { InvoiceTrackerEnhancedPage } from '../pages/ap-hub/InvoiceTrackerEnhancedPage';
import { MyApprovalsEnhancedPage } from '../pages/ap-hub/MyApprovalsEnhancedPage';
import { DOAMatrixPage } from '../pages/ap-hub/DOAMatrixPage';
import { CFOAnalyticsPage } from '../pages/ap-hub/CFOAnalyticsPage';
import { UsersRolesPageDynamic as UsersRolesPage } from '../pages/ap-hub/UsersRolesPageDynamic';
import { SystemSettingsPage } from '../pages/ap-hub/SystemSettingsPage';

// Error Pages
import { NotFoundPage } from '../pages/error/NotFoundPage';
import { ForbiddenPage } from '../pages/error/ForbiddenPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Microsoft SSO Callback (public) */}
      <Route path="/auth/callback" element={<MicrosoftCallback />} />

      {/* Private Routes */}
      <Route element={<PrivateRoute />}>
        {/* Hub Selector - Landing Page */}
        <Route path="/" element={<HubSelectorPage />} />
        <Route path="/hubs" element={<HubSelectorPage />} />

        {/* AP Hub Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/hub/ap/dashboard" element={<APDashboardPage />} />
          <Route path="/hub/ap/email-intake" element={<EmailIntakePage />} />
          <Route path="/hub/ap/invoices" element={<InvoiceTrackerEnhancedPage />} />
          <Route path="/hub/ap/approvals" element={<MyApprovalsEnhancedPage />} />
          <Route path="/hub/ap/doa-matrix" element={<DOAMatrixPage />} />
          <Route path="/hub/ap/analytics" element={<CFOAnalyticsPage />} />
          <Route path="/hub/ap/users" element={<UsersRolesPage />} />
          <Route path="/hub/ap/settings" element={<SystemSettingsPage />} />

          {/* Legacy routes - redirect to hub structure */}
          <Route path="/dashboard" element={<Navigate to="/hub/ap/dashboard" replace />} />
          <Route path="/invoices" element={<Navigate to="/hub/ap/invoices" replace />} />
          <Route path="/approvals" element={<Navigate to="/hub/ap/approvals" replace />} />

          {/* Role-based routes example */}
          {/* <Route element={<RoleBasedRoute roles={['admin', 'company_admin']} />}>
            <Route path="/settings/*" element={<SettingsRoutes />} />
          </Route> */}
        </Route>
      </Route>

      {/* Error Routes */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
