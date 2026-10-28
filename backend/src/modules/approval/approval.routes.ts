import { Router } from 'express';
import { ApprovalController } from './controllers/approval.controller';
import { authenticate } from '../auth/guards/auth.guard';
import { hasPermission } from '../auth/guards/permission.guard';

const router = Router();
const controller = new ApprovalController();

router.use(authenticate);

router.get(
  '/pending',
  hasPermission('approvals:read'),
  controller.getPendingApprovals.bind(controller)
);

router.get(
  '/history',
  hasPermission('approvals:read'),
  controller.getApprovalHistory.bind(controller)
);

router.get(
  '/stats',
  hasPermission('approvals:read'),
  controller.getApprovalStats.bind(controller)
);

router.get(
  '/escalations',
  hasPermission('approvals:manage'),
  controller.getEscalations.bind(controller)
);

router.post(
  '/:approvalId/approve',
  hasPermission('approvals:approve'),
  controller.approveInvoice.bind(controller)
);

router.post(
  '/:approvalId/reject',
  hasPermission('approvals:approve'),
  controller.rejectInvoice.bind(controller)
);

router.post(
  '/:approvalId/request-info',
  hasPermission('approvals:approve'),
  controller.requestInfo.bind(controller)
);

router.post(
  '/:approvalId/escalate',
  hasPermission('approvals:manage'),
  controller.escalateApproval.bind(controller)
);

router.post(
  '/bulk-approve',
  hasPermission('approvals:approve'),
  controller.bulkApprove.bind(controller)
);

router.post(
  '/bulk-reject',
  hasPermission('approvals:approve'),
  controller.bulkReject.bind(controller)
);

router.get(
  '/chain/:invoiceId',
  hasPermission('approvals:read'),
  controller.generateApprovalChain.bind(controller)
);

router.post(
  '/chain/:invoiceId',
  hasPermission('approvals:manage'),
  controller.createApprovalChain.bind(controller)
);

router.get(
  '/doa-matrix',
  hasPermission('settings:read'),
  controller.getDOAMatrix.bind(controller)
);

router.post(
  '/doa-matrix',
  hasPermission('settings:manage'),
  controller.createDOARule.bind(controller)
);

router.put(
  '/doa-matrix/:ruleId',
  hasPermission('settings:manage'),
  controller.updateDOARule.bind(controller)
);

router.delete(
  '/doa-matrix/:ruleId',
  hasPermission('settings:manage'),
  controller.deleteDOARule.bind(controller)
);

export default router;
