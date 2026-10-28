import { Router } from 'express';
import { InvoiceTrackerController } from './controllers/invoice-tracker.controller';
import { authenticate } from '../auth/guards/auth.guard';
import { hasPermission } from '../auth/guards/permission.guard';

const router = Router();
const controller = new InvoiceTrackerController();

router.use(authenticate);

router.get(
  '/',
  hasPermission('invoices:read'),
  controller.getInvoices.bind(controller)
);

router.get(
  '/pipeline-stats',
  hasPermission('invoices:read'),
  controller.getPipelineStats.bind(controller)
);

router.get(
  '/aging-report',
  hasPermission('invoices:read'),
  controller.getAgingReport.bind(controller)
);

router.get(
  '/vendor/:vendorId',
  hasPermission('invoices:read'),
  controller.getInvoicesByVendor.bind(controller)
);

router.get(
  '/:invoiceId',
  hasPermission('invoices:read'),
  controller.getInvoiceDetail.bind(controller)
);

router.post(
  '/bulk-update',
  hasPermission('invoices:update'),
  controller.bulkUpdateStatus.bind(controller)
);

export default router;
