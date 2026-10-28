// Role-based access configuration
export const ROLE_CODES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  CFO: 'CFO',
  FINANCE_CONTROLLER: 'FINANCE_CONTROLLER',
  FUNCTIONAL_HEAD: 'FUNCTIONAL_HEAD',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  AP_CLERK: 'AP_CLERK',
  AUDITOR: 'AUDITOR',
} as const;

export type RoleCode = typeof ROLE_CODES[keyof typeof ROLE_CODES];

export interface RoleConfig {
  code: RoleCode;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  approvalRange?: string;
  tabs: string[];
  canEdit: boolean;
  canApprove: boolean;
}

export const ROLE_CONFIGS: Record<RoleCode, RoleConfig> = {
  [ROLE_CODES.SYSTEM_ADMIN]: {
    code: ROLE_CODES.SYSTEM_ADMIN,
    name: 'System Admin',
    displayName: 'System Admin',
    description: 'Full access · approves L1-L5',
    color: 'bg-purple-500',
    icon: 'AM',
    approvalRange: 'L1-L5',
    tabs: ['dashboard', 'email-intake', 'invoice-tracker', 'my-approvals', 'doa-matrix', 'cfo-analytics', 'users-roles', 'system-settings'],
    canEdit: true,
    canApprove: true,
  },
  [ROLE_CODES.CFO]: {
    code: ROLE_CODES.CFO,
    name: 'CFO',
    displayName: 'CFO',
    description: 'Approves ₹25L–₹1Cr · CFO cockpit',
    color: 'bg-orange-500',
    icon: 'DN',
    approvalRange: '₹25L–₹1Cr',
    tabs: ['dashboard', 'invoice-tracker', 'my-approvals', 'doa-matrix', 'cfo-analytics'],
    canEdit: false,
    canApprove: true,
  },
  [ROLE_CODES.FINANCE_CONTROLLER]: {
    code: ROLE_CODES.FINANCE_CONTROLLER,
    name: 'Finance Controller',
    displayName: 'Finance Controller',
    description: 'Approves ₹5L–₹25L',
    color: 'bg-green-500',
    icon: 'RP',
    approvalRange: '₹5L–₹25L',
    tabs: ['dashboard', 'invoice-tracker', 'my-approvals', 'doa-matrix', 'cfo-analytics'],
    canEdit: false,
    canApprove: true,
  },
  [ROLE_CODES.FUNCTIONAL_HEAD]: {
    code: ROLE_CODES.FUNCTIONAL_HEAD,
    name: 'Functional Head',
    displayName: 'Functional Head — Network',
    description: 'Approves ₹50k–₹5L',
    color: 'bg-indigo-500',
    icon: 'SK',
    approvalRange: '₹50k–₹5L',
    tabs: ['dashboard', 'invoice-tracker', 'my-approvals', 'doa-matrix'],
    canEdit: false,
    canApprove: true,
  },
  [ROLE_CODES.BRANCH_MANAGER]: {
    code: ROLE_CODES.BRANCH_MANAGER,
    name: 'Branch Manager',
    displayName: 'Branch Manager — Kochi',
    description: 'Approves ≤ ₹50k',
    color: 'bg-pink-500',
    icon: 'LV',
    approvalRange: '≤ ₹50k',
    tabs: ['dashboard', 'invoice-tracker', 'my-approvals', 'doa-matrix'],
    canEdit: false,
    canApprove: true,
  },
  [ROLE_CODES.AP_CLERK]: {
    code: ROLE_CODES.AP_CLERK,
    name: 'AP Clerk',
    displayName: 'AP Clerk',
    description: 'Mailbox ingestion · no approvals',
    color: 'bg-yellow-500',
    icon: 'AT',
    tabs: ['dashboard', 'email-intake', 'invoice-tracker', 'doa-matrix'],
    canEdit: true,
    canApprove: false,
  },
  [ROLE_CODES.AUDITOR]: {
    code: ROLE_CODES.AUDITOR,
    name: 'Auditor',
    displayName: 'Auditor (Read-only)',
    description: 'Read-only audit access',
    color: 'bg-gray-500',
    icon: 'VI',
    tabs: ['dashboard', 'invoice-tracker', 'doa-matrix', 'cfo-analytics'],
    canEdit: false,
    canApprove: false,
  },
};

// Map tab names to routes
export const TAB_ROUTES: Record<string, { name: string; path: string; icon: string }> = {
  'hub-selector': {
    name: 'Hub Selector',
    path: '/hubs',
    icon: '🏠',
  },
  'dashboard': {
    name: 'Dashboard',
    path: '/hub/ap/dashboard',
    icon: '📊',
  },
  'email-intake': {
    name: 'Email Intake',
    path: '/hub/ap/email-intake',
    icon: '📧',
  },
  'invoice-tracker': {
    name: 'Invoice Tracker',
    path: '/hub/ap/invoices',
    icon: '📄',
  },
  'my-approvals': {
    name: 'My Approvals',
    path: '/hub/ap/approvals',
    icon: '✅',
  },
  'doa-matrix': {
    name: 'DOA Matrix',
    path: '/hub/ap/doa-matrix',
    icon: '🔐',
  },
  'cfo-analytics': {
    name: 'CFO Analytics',
    path: '/hub/ap/analytics',
    icon: '📈',
  },
  'users-roles': {
    name: 'Users & Roles',
    path: '/hub/ap/users',
    icon: '👥',
  },
  'system-settings': {
    name: 'System Settings',
    path: '/hub/ap/settings',
    icon: '⚙️',
  },
};

// Helper to get user's role config
export const getUserRoleConfig = (userRoles: any[]): RoleConfig | null => {
  if (!userRoles || userRoles.length === 0) return null;

  // Find the first matching role from user's roles
  for (const userRole of userRoles) {
    const roleCode = userRole.code as RoleCode;
    if (ROLE_CONFIGS[roleCode]) {
      return ROLE_CONFIGS[roleCode];
    }
  }

  return null;
};

// Helper to check if user has access to a tab
export const canAccessTab = (userRoles: any[], tabKey: string): boolean => {
  const roleConfig = getUserRoleConfig(userRoles);
  if (!roleConfig) return false;
  return roleConfig.tabs.includes(tabKey);
};

// Get all accessible tabs for user
export const getAccessibleTabs = (userRoles: any[]) => {
  const roleConfig = getUserRoleConfig(userRoles);
  if (!roleConfig) return [];

  return roleConfig.tabs
    .map(tabKey => TAB_ROUTES[tabKey])
    .filter(Boolean);
};
