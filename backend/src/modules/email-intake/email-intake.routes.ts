import { Router } from 'express';
import { EmailIntakeController } from './controllers/email-intake.controller';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';

const router = Router();
const emailIntakeController = new EmailIntakeController();
const authGuard = new AuthGuard();

// All routes require authentication and email intake permission
router.post(
  '/process',
  authGuard.authenticate,
  PermissionGuard.hasPermission('email_intake:process'),
  emailIntakeController.processEmails
);

router.get(
  '/stats',
  authGuard.authenticate,
  PermissionGuard.hasPermission('email_intake:read'),
  emailIntakeController.getStats
);

router.get(
  '/history',
  authGuard.authenticate,
  PermissionGuard.hasPermission('email_intake:read'),
  emailIntakeController.getHistory
);

router.get(
  '/pending-review',
  authGuard.authenticate,
  PermissionGuard.hasPermission('email_intake:read'),
  emailIntakeController.getPendingReview
);

export default router;
