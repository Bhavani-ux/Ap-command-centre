export interface EmailIntakeStats {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  partialCount: number;
  invoicesCreated: number;
  lastProcessedAt?: string;
  averageProcessingTime: number;
}

export interface EmailIntakeHistory {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  processedAt: string;
  status: 'success' | 'failed' | 'partial';
  invoicesCreated: number;
  errors: string[];
  attachmentCount: number;
}

export interface PendingReviewItem {
  id: string;
  attachmentFilename: string;
  extractedData: {
    invoiceNumber?: string;
    vendorName?: string;
    invoiceDate?: string;
    dueDate?: string;
    totalAmount?: number;
    currency?: string;
  };
  confidenceScore: number;
  createdAt: string;
  fromAddress: string;
  subject: string;
}

export interface ProcessEmailResult {
  id: string;
  emailId: string;
  from: string;
  subject: string;
  receivedAt: string;
  processedAt: string;
  status: 'success' | 'failed' | 'partial';
  invoicesCreated: number;
  errors: string[];
}
