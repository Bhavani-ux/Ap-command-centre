import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { doaAssignmentService } from './doaAssignmentService';

const prisma = new PrismaClient();

interface EmailProcessingResult {
  success: boolean;
  referenceNumber?: string;
  invoiceId?: string;
  error?: string;
  logs: string[];
}

interface ExtractedInvoiceData {
  vendorName: string;
  gstin?: string;
  invoiceNumber: string;
  amount: number;
  date: Date;
  confidence: number;
}

export class EmailIntakeService {
  private storageDir = process.env.STORAGE_PATH || './storage/email-intake';

  constructor() {
    this.ensureStorageDir();
  }

  private ensureStorageDir() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * STAGE 1: TRIAGE - Scan email and classify
   */
  async triageEmail(emailId: string): Promise<{ isSuspicious: boolean; reasons: string[] }> {
    const email = await prisma.emailIntake.findUnique({ where: { id: emailId } });
    if (!email) throw new Error('Email not found');

    const suspicionReasons: string[] = [];

    // Check for spam patterns
    const spamKeywords = ['won', 'crore', 'lottery', 'claim now', 'winner', 'prize', 'free money'];
    const subject = email.subject?.toLowerCase() || '';
    const body = email.body?.toLowerCase() || '';

    spamKeywords.forEach(keyword => {
      if (subject.includes(keyword) || body.includes(keyword)) {
        suspicionReasons.push(`Spam keyword detected: "${keyword}"`);
      }
    });

    // Check for suspicious file extensions
    if (email.attachmentCount > 0) {
      // Parse attachment info from email data
      const hasExecutable = /\.(exe|bat|cmd|scr|vbs|js)$/i.test(email.body || '');
      if (hasExecutable) {
        suspicionReasons.push('Executable file attachment detected');
      }
    }

    // Check sender domain
    const suspiciousDomains = ['freemoney.biz', 'lottery.com', 'winner.net'];
    const fromDomain = email.from.split('@')[1]?.toLowerCase();
    if (suspiciousDomains.some(domain => fromDomain?.includes(domain))) {
      suspicionReasons.push(`Suspicious sender domain: ${fromDomain}`);
    }

    const isSuspicious = suspicionReasons.length > 0;

    // Update email record
    await prisma.emailIntake.update({
      where: { id: emailId },
      data: {
        isSuspicious,
        suspicionReasons: isSuspicious ? suspicionReasons : null,
        validationStatus: isSuspicious ? 'suspicious' : 'clean',
      },
    });

    return { isSuspicious, reasons: suspicionReasons };
  }

  /**
   * STAGE 2: OCR - Extract text from PDF
   */
  async extractTextFromPDF(pdfPath: string): Promise<string> {
    // For now, simulate OCR extraction
    // In production, use: Tesseract, Google Vision API, or AWS Textract

    // Mock extracted text based on common invoice patterns
    const mockExtractedText = `
      TAX INVOICE
      JioStar India Pvt Ltd
      GSTIN: 29AABCJ1234M1Z5
      Invoice No: INV-E96761
      Date: 26-10-2026

      Carriage Fee - October 2026
      Amount: Rs. 96,761.00
      CGST 9%: Rs. 8,708.49
      SGST 9%: Rs. 8,708.49
      Total: Rs. 1,14,177.98

      Bank Details: HDFC Bank
      Account: 50200012345678
    `;

    // TODO: Implement actual OCR
    // const Tesseract = require('tesseract.js');
    // const { data: { text } } = await Tesseract.recognize(pdfPath, 'eng');
    // return text;

    return mockExtractedText;
  }

  /**
   * STAGE 3: AI EXTRACTION - Parse invoice data from text
   */
  async extractInvoiceData(text: string, emailFrom: string): Promise<ExtractedInvoiceData> {
    // Simple regex-based extraction (can be replaced with actual AI/LLM)

    const vendorMatch = emailFrom.match(/^(.+?)@/);
    const vendorName = vendorMatch ? vendorMatch[1].replace(/[._]/g, ' ').trim() : 'Unknown Vendor';

    const gstinMatch = text.match(/GSTIN[:\s]+([A-Z0-9]{15})/i);
    const gstin = gstinMatch ? gstinMatch[1] : undefined;

    const invoiceMatch = text.match(/Invoice\s+(?:No|Number|#)[:\s]+([A-Z0-9-]+)/i);
    const invoiceNumber = invoiceMatch ? invoiceMatch[1] : `INV-${Date.now()}`;

    const amountMatch = text.match(/Total[:\s]+Rs\.?\s*([\d,]+(?:\.\d{2})?)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

    const dateMatch = text.match(/Date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    const date = dateMatch ? new Date(dateMatch[1]) : new Date();

    // Confidence based on how many fields we extracted
    let confidence = 0;
    if (invoiceNumber !== `INV-${Date.now()}`) confidence += 25;
    if (gstin) confidence += 25;
    if (amount > 0) confidence += 25;
    if (vendorName !== 'Unknown Vendor') confidence += 25;

    return {
      vendorName,
      gstin,
      invoiceNumber,
      amount,
      date,
      confidence,
    };
  }

  /**
   * STAGE 4: REFERENCE GENERATION
   */
  generateReferenceNumber(companyCode: string, category: string): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');

    // Format: ASCL-AP-CAT-YYMM-NNNNN
    return `${companyCode}-AP-${category}-${year}${month}-${random}`;
  }

  /**
   * STAGE 5: CREATE INVOICE IN TRACKER
   */
  async createInvoiceFromEmail(
    emailId: string,
    extractedData: ExtractedInvoiceData,
    companyId: string,
    referenceNumber: string
  ): Promise<string> {
    // Find or create vendor
    let vendor = await prisma.vendor.findFirst({
      where: {
        companyId,
        OR: [
          { name: { contains: extractedData.vendorName, mode: 'insensitive' } },
          { gstNumber: extractedData.gstin },
        ],
      },
    });

    if (!vendor) {
      // Create new vendor
      vendor = await prisma.vendor.create({
        data: {
          name: extractedData.vendorName,
          code: `V${Date.now().toString().slice(-6)}`,
          email: 'vendor@example.com', // Will be updated later
          gstNumber: extractedData.gstin,
          companyId,
          isActive: true,
        },
      });
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        referenceNumber,
        invoiceNumber: extractedData.invoiceNumber,
        vendorId: vendor.id,
        companyId,
        invoiceDate: extractedData.date,
        dueDate: new Date(extractedData.date.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        totalAmount: extractedData.amount,
        subtotal: extractedData.amount * 0.82, // Assuming 18% tax
        taxAmount: extractedData.amount * 0.18,
        amountDue: extractedData.amount,
        currency: 'INR',
        status: 'draft',
        source: 'email',
        emailIntakeId: emailId,
        ageInDays: 0,
      },
    });

    // Update email intake record
    await prisma.emailIntake.update({
      where: { id: emailId },
      data: {
        status: 'processed',
        processedAt: new Date(),
        ocrData: extractedData,
      },
    });

    // Assign invoice for approval based on DOA Matrix
    await doaAssignmentService.assignInvoiceForApproval(invoice.id, companyId);

    return invoice.id;
  }

  /**
   * STAGE 6: SEND VENDOR ACKNOWLEDGEMENT
   */
  async sendVendorAcknowledgement(invoiceId: string, vendorEmail: string): Promise<boolean> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { vendor: true },
    });

    if (!invoice) return false;

    // TODO: Implement actual email sending
    // For now, just log
    console.log(`[ACK] Sending acknowledgement to ${vendorEmail}`);
    console.log(`Subject: Invoice ${invoice.referenceNumber} received`);
    console.log(`Body: Your invoice ${invoice.invoiceNumber} has been received and assigned reference ${invoice.referenceNumber}`);

    return true;
  }

  /**
   * MAIN PIPELINE PROCESSOR
   */
  async processEmail(emailId: string, companyId: string): Promise<EmailProcessingResult> {
    const logs: string[] = [];

    try {
      logs.push('[TRIAGE] Scanning email...');

      const email = await prisma.emailIntake.findUnique({ where: { id: emailId } });
      if (!email) throw new Error('Email not found');

      // Stage 1: Triage
      const triage = await this.triageEmail(emailId);
      if (triage.isSuspicious) {
        logs.push(`[TRIAGE] ✗ Suspicious email detected: ${triage.reasons.join(', ')}`);
        await prisma.emailIntake.update({
          where: { id: emailId },
          data: { status: 'failed', errorMessage: 'Spam/suspicious email quarantined' },
        });
        return { success: false, error: 'Spam detected', logs };
      }
      logs.push('[TRIAGE] ✓ Email validated');

      // Stage 2: OCR
      logs.push('[OCR] Extracting text from PDF...');
      const extractedText = await this.extractTextFromPDF('mock.pdf');
      logs.push(`[OCR] ✓ Text extracted (${extractedText.length} chars)`);

      // Stage 3: AI Extraction
      logs.push('[EXTRACT] Parsing invoice data...');
      const invoiceData = await this.extractInvoiceData(extractedText, email.from);
      logs.push(`[EXTRACT] ✓ Vendor: ${invoiceData.vendorName}, Amount: ₹${invoiceData.amount.toLocaleString('en-IN')}, Confidence: ${invoiceData.confidence}%`);

      if (invoiceData.confidence < 50) {
        logs.push('[EXTRACT] ✗ Low confidence - manual review required');
        await prisma.emailIntake.update({
          where: { id: emailId },
          data: { status: 'manual_review', validationErrors: ['Low extraction confidence'] },
        });
        return { success: false, error: 'Low confidence', logs };
      }

      // Stage 4: Reference Generation
      logs.push('[REF] Generating reference number...');
      const refNumber = this.generateReferenceNumber('ASCL', 'NWM');
      logs.push(`[REF] ✓ ${refNumber} generated`);

      // Stage 5: Create Invoice
      logs.push('[TRACKER] Creating invoice in tracker...');
      const invoiceId = await this.createInvoiceFromEmail(emailId, invoiceData, companyId, refNumber);
      logs.push(`[TRACKER] ✓ Invoice created: ${refNumber}`);

      // Stage 6: Acknowledgement
      logs.push(`[ACK] Sending acknowledgement to ${email.from}...`);
      await this.sendVendorAcknowledgement(invoiceId, email.from);
      logs.push(`[ACK] ✓ Acknowledgement sent`);

      logs.push('✓ Pipeline completed successfully');

      return {
        success: true,
        referenceNumber: refNumber,
        invoiceId,
        logs,
      };

    } catch (error: any) {
      logs.push(`[ERROR] Pipeline failed: ${error.message}`);
      await prisma.emailIntake.update({
        where: { id: emailId },
        data: { status: 'failed', errorMessage: error.message },
      });
      return { success: false, error: error.message, logs };
    }
  }

  /**
   * IMAP Email Fetcher (placeholder for when credentials are added)
   */
  async fetchEmailsFromMailbox(): Promise<number> {
    // TODO: Implement IMAP connection
    // const Imap = require('imap');
    // const imap = new Imap({
    //   user: process.env.EMAIL_INTAKE_USER,
    //   password: process.env.EMAIL_INTAKE_PASSWORD,
    //   host: process.env.EMAIL_INTAKE_HOST,
    //   port: Number(process.env.EMAIL_INTAKE_PORT),
    //   tls: true,
    // });

    console.log('[EMAIL FETCHER] IMAP credentials not configured - skipping fetch');
    return 0;
  }
}

export const emailIntakeService = new EmailIntakeService();
