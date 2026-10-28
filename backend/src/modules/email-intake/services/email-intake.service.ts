import { PrismaClient } from '@prisma/client';
import { EmailClientService } from './email-client.service';
import { OCRService } from './ocr.service';
import { FileStorageService } from './file-storage.service';
import {
  EmailMessageDto,
  ProcessedEmailDto,
  ExtractedInvoiceDataDto,
  EmailIntakeStatsDto,
  EmailIntakeHistoryDto,
} from '../dto/email-intake.dto';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class EmailIntakeService {
  private emailClient: EmailClientService;
  private ocrService: OCRService;
  private fileStorage: FileStorageService;

  constructor() {
    this.emailClient = new EmailClientService();
    this.ocrService = new OCRService();
    this.fileStorage = new FileStorageService();
  }

  async processIncomingEmails(companyId: string): Promise<ProcessedEmailDto[]> {
    const results: ProcessedEmailDto[] = [];

    try {
      // Connect to email server
      await this.emailClient.connect();
      await this.emailClient.openInbox();

      // Fetch unread emails
      const emails = await this.emailClient.fetchUnreadEmails(10);

      console.log(`Found ${emails.length} unread emails`);

      for (const email of emails) {
        try {
          const result = await this.processEmail(email, companyId);
          results.push(result);

          // Mark as read and move to processed folder
          await this.emailClient.markAsRead(email.uid);
          if (result.status === 'success') {
            await this.emailClient.moveToFolder(
              email.uid,
              'INBOX/Processed'
            );
          } else {
            await this.emailClient.moveToFolder(email.uid, 'INBOX/Failed');
          }
        } catch (error) {
          console.error(`Error processing email ${email.id}:`, error);
          results.push({
            id: uuidv4(),
            emailId: email.id,
            uid: email.uid,
            from: email.from,
            subject: email.subject,
            receivedAt: email.receivedDate,
            processedAt: new Date(),
            status: 'failed',
            invoicesCreated: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
          });
        }
      }
    } catch (error) {
      console.error('Error in email intake process:', error);
    } finally {
      await this.emailClient.disconnect();
    }

    return results;
  }

  private async processEmail(
    email: EmailMessageDto,
    companyId: string
  ): Promise<ProcessedEmailDto> {
    const errors: string[] = [];
    let invoicesCreated = 0;
    const startTime = Date.now();

    // Validate sender
    if (!this.emailClient.isAllowedSender(email.from)) {
      errors.push(`Sender not allowed: ${email.from}`);
      return this.createProcessedResult(
        email,
        'failed',
        invoicesCreated,
        errors,
        startTime
      );
    }

    // Check for attachments
    if (email.attachments.length === 0) {
      errors.push('No attachments found');
      return this.createProcessedResult(
        email,
        'failed',
        invoicesCreated,
        errors,
        startTime
      );
    }

    // Log email intake
    const intakeLog = await prisma.$queryRawUnsafe(
      `INSERT INTO email_intake_logs (
        id, company_id, email_id, uid, from_address, subject,
        received_at, processed_at, status, attachment_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)
      RETURNING id`,
      uuidv4(),
      companyId,
      email.id,
      email.uid,
      email.from,
      email.subject,
      email.receivedDate,
      'processing',
      email.attachments.length
    );

    const intakeLogId = (intakeLog as any[])[0]?.id;

    // Process each attachment
    for (const attachment of email.attachments) {
      try {
        // Validate attachment
        if (!this.emailClient.isValidAttachment(attachment)) {
          errors.push(
            `Invalid attachment: ${attachment.filename} (size or type)`
          );
          continue;
        }

        // Store attachment
        const filePath = await this.fileStorage.saveAttachment(
          attachment,
          companyId
        );

        // Extract invoice data
        let extractedData: ExtractedInvoiceDataDto;

        if (attachment.filename.toLowerCase().endsWith('.pdf')) {
          // For PDF, we'd use pdf-parse
          errors.push(`PDF extraction not yet implemented: ${attachment.filename}`);
          continue;
        } else {
          // Image OCR
          const ocrText = await this.ocrService.extractTextFromImage(
            attachment.content
          );
          extractedData = await this.ocrService.extractInvoiceData(ocrText);
        }

        // Save extracted data
        await prisma.$executeRawUnsafe(
          `INSERT INTO extracted_invoice_data (
            id, email_intake_log_id, company_id, attachment_filename,
            extracted_data, confidence_score, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          uuidv4(),
          intakeLogId,
          companyId,
          attachment.filename,
          JSON.stringify(extractedData),
          extractedData.confidence,
          this.ocrService.isHighConfidence(extractedData.confidence)
            ? 'ready'
            : 'review_required'
        );

        // If high confidence, create draft invoice
        if (this.ocrService.isHighConfidence(extractedData.confidence)) {
          await this.createDraftInvoice(extractedData, companyId, filePath);
          invoicesCreated++;
        } else {
          errors.push(
            `Low confidence (${extractedData.confidence.toFixed(2)}) for ${
              attachment.filename
            } - manual review required`
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error processing ${attachment.filename}: ${errorMessage}`);
      }
    }

    // Update intake log
    const finalStatus =
      errors.length === 0 ? 'success' : invoicesCreated > 0 ? 'partial' : 'failed';

    await prisma.$executeRawUnsafe(
      `UPDATE email_intake_logs
       SET status = $1, invoices_created = $2, errors = $3, updated_at = NOW()
       WHERE id = $4`,
      finalStatus,
      invoicesCreated,
      JSON.stringify(errors),
      intakeLogId
    );

    return this.createProcessedResult(
      email,
      finalStatus,
      invoicesCreated,
      errors,
      startTime
    );
  }

  private async createDraftInvoice(
    data: ExtractedInvoiceDataDto,
    companyId: string,
    attachmentPath: string
  ): Promise<string> {
    // Find or create vendor
    let vendorId: string;

    if (data.vendorName) {
      const existingVendor = await prisma.vendor.findFirst({
        where: {
          companyId,
          name: { contains: data.vendorName, mode: 'insensitive' },
        },
      });

      if (existingVendor) {
        vendorId = existingVendor.id;
      } else {
        const newVendor = await prisma.vendor.create({
          data: {
            companyId,
            vendorCode: `AUTO-${Date.now()}`,
            name: data.vendorName,
            email: data.vendorEmail,
            isActive: true,
          },
        });
        vendorId = newVendor.id;
      }
    } else {
      throw new Error('Vendor name is required');
    }

    // Create draft invoice
    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        vendorId,
        invoiceNumber: data.invoiceNumber || `DRAFT-${Date.now()}`,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        currency: data.currency || 'USD',
        subtotal: data.subtotal || data.totalAmount || 0,
        taxAmount: data.taxAmount || 0,
        totalAmount: data.totalAmount || 0,
        amountDue: data.totalAmount || 0,
        status: 'draft',
        approvalStatus: 'pending',
        paymentStatus: 'unpaid',
        poNumber: data.poNumber,
        notes: 'Auto-created from email intake',
      },
    });

    // Create line items if available
    if (data.lineItems && data.lineItems.length > 0) {
      for (let i = 0; i < data.lineItems.length; i++) {
        const item = data.lineItems[i];
        await prisma.invoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            lineNumber: i + 1,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || item.amount,
            amount: item.amount,
          },
        });
      }
    }

    // Create attachment record
    await prisma.$executeRawUnsafe(
      `INSERT INTO attachments (id, invoice_id, file_name, file_path, file_size, file_type, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      uuidv4(),
      invoice.id,
      attachmentPath.split('/').pop(),
      attachmentPath,
      0,
      'application/octet-stream'
    );

    return invoice.id;
  }

  private createProcessedResult(
    email: EmailMessageDto,
    status: 'success' | 'failed' | 'partial',
    invoicesCreated: number,
    errors: string[],
    startTime: number
  ): ProcessedEmailDto {
    return {
      id: uuidv4(),
      emailId: email.id,
      uid: email.uid,
      from: email.from,
      subject: email.subject,
      receivedAt: email.receivedDate,
      processedAt: new Date(),
      status,
      invoicesCreated,
      errors,
    };
  }

  async getIntakeStats(companyId: string): Promise<EmailIntakeStatsDto> {
    const result = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
        COUNT(*) as total_processed,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial_count,
        SUM(invoices_created) as invoices_created,
        MAX(processed_at) as last_processed_at,
        AVG(EXTRACT(EPOCH FROM (updated_at - processed_at))) as avg_processing_time
       FROM email_intake_logs
       WHERE company_id = $1`,
      companyId
    );

    const row = result[0];

    return {
      totalProcessed: parseInt(row.total_processed, 10) || 0,
      successCount: parseInt(row.success_count, 10) || 0,
      failedCount: parseInt(row.failed_count, 10) || 0,
      partialCount: parseInt(row.partial_count, 10) || 0,
      invoicesCreated: parseInt(row.invoices_created, 10) || 0,
      lastProcessedAt: row.last_processed_at,
      averageProcessingTime: parseFloat(row.avg_processing_time) || 0,
    };
  }

  async getIntakeHistory(
    companyId: string,
    limit: number = 50
  ): Promise<EmailIntakeHistoryDto[]> {
    const results = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
        id, from_address, subject, received_at, processed_at,
        status, invoices_created, errors, attachment_count
       FROM email_intake_logs
       WHERE company_id = $1
       ORDER BY processed_at DESC
       LIMIT $2`,
      companyId,
      limit
    );

    return results.map((row) => ({
      id: row.id,
      from: row.from_address,
      subject: row.subject,
      receivedAt: row.received_at,
      processedAt: row.processed_at,
      status: row.status,
      invoicesCreated: row.invoices_created,
      errors: row.errors || [],
      attachmentCount: row.attachment_count,
    }));
  }

  async getPendingReviewItems(companyId: string): Promise<any[]> {
    const results = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
        e.id, e.attachment_filename, e.extracted_data,
        e.confidence_score, e.created_at,
        l.from_address, l.subject
       FROM extracted_invoice_data e
       JOIN email_intake_logs l ON e.email_intake_log_id = l.id
       WHERE e.company_id = $1 AND e.status = 'review_required'
       ORDER BY e.created_at DESC`,
      companyId
    );

    return results;
  }
}
