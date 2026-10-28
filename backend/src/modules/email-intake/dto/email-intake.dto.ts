export interface EmailMessageDto {
  id: string;
  uid: number;
  from: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml: string;
  receivedDate: Date;
  attachments: EmailAttachmentDto[];
}

export interface EmailAttachmentDto {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
}

export interface ProcessedEmailDto {
  id: string;
  emailId: string;
  uid: number;
  from: string;
  subject: string;
  receivedAt: Date;
  processedAt: Date;
  status: 'success' | 'failed' | 'partial';
  invoicesCreated: number;
  errors: string[];
}

export interface ExtractedInvoiceDataDto {
  invoiceNumber?: string;
  vendorName?: string;
  vendorEmail?: string;
  invoiceDate?: string;
  dueDate?: string;
  totalAmount?: number;
  currency?: string;
  lineItems?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    amount: number;
  }>;
  taxAmount?: number;
  subtotal?: number;
  poNumber?: string;
  confidence: number;
}

export interface EmailIntakeStatsDto {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  partialCount: number;
  invoicesCreated: number;
  lastProcessedAt?: Date;
  averageProcessingTime: number; // in seconds
}

export interface EmailIntakeHistoryDto {
  id: string;
  from: string;
  subject: string;
  receivedAt: Date;
  processedAt: Date;
  status: 'success' | 'failed' | 'partial';
  invoicesCreated: number;
  errors: string[];
  attachmentCount: number;
}
