import { Router } from 'express';
import { emailIntakeService } from '../services/emailIntakeService';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all unprocessed emails
router.get('/', async (req: any, res) => {
  try {
    const emails = await prisma.emailIntake.findMany({
      where: {
        status: { in: ['received', 'processing'] },
      },
      orderBy: { receivedAt: 'desc' },
      take: 50,
    });

    res.json({ emails });
  } catch (error) {
    console.error('Get emails error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process single email through pipeline
router.post('/:id/process', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const result = await emailIntakeService.processEmail(id, companyId);

    res.json({
      success: result.success,
      referenceNumber: result.referenceNumber,
      invoiceId: result.invoiceId,
      logs: result.logs,
      error: result.error,
    });
  } catch (error: any) {
    console.error('Process email error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process all unprocessed emails (bulk)
router.post('/process-all', async (req: any, res) => {
  try {
    const { companyId } = req.user;

    const emails = await prisma.emailIntake.findMany({
      where: {
        status: 'received',
        isSuspicious: false,
      },
      take: 10, // Process max 10 at a time
    });

    const results = [];

    for (const email of emails) {
      const result = await emailIntakeService.processEmail(email.id, companyId);
      results.push({
        emailId: email.id,
        subject: email.subject,
        ...result,
      });
    }

    res.json({
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error: any) {
    console.error('Process all emails error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pipeline logs for an email
router.get('/:id/logs', async (req: any, res) => {
  try {
    const { id } = req.params;

    const email = await prisma.emailIntake.findUnique({
      where: { id },
    });

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Get related invoice if exists
    const invoice = await prisma.invoice.findFirst({
      where: { emailIntakeId: id },
    });

    res.json({
      email,
      invoice,
      logs: email.ocrData || [],
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manually fetch emails from mailbox (when credentials are configured)
router.post('/fetch', async (req: any, res) => {
  try {
    const fetched = await emailIntakeService.fetchEmailsFromMailbox();

    res.json({
      message: 'Email fetch initiated',
      fetched,
    });
  } catch (error: any) {
    console.error('Fetch emails error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
