import { config } from 'dotenv';

config();

export const emailIntakeConfig = {
  imap: {
    user: process.env.EMAIL_INTAKE_USER || '',
    password: process.env.EMAIL_INTAKE_PASSWORD || '',
    host: process.env.EMAIL_INTAKE_HOST || 'imap.gmail.com',
    port: parseInt(process.env.EMAIL_INTAKE_PORT || '993', 10),
    tls: process.env.EMAIL_INTAKE_TLS === 'true' || true,
    authTimeout: 10000,
  },
  processing: {
    pollInterval: parseInt(process.env.EMAIL_POLL_INTERVAL || '300000', 10), // 5 minutes
    batchSize: parseInt(process.env.EMAIL_BATCH_SIZE || '10', 10),
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '60000', 10), // 1 minute
  },
  folders: {
    inbox: process.env.EMAIL_INBOX_FOLDER || 'INBOX',
    processed: process.env.EMAIL_PROCESSED_FOLDER || 'INBOX/Processed',
    failed: process.env.EMAIL_FAILED_FOLDER || 'INBOX/Failed',
  },
  allowedSenders: (process.env.EMAIL_ALLOWED_SENDERS || '').split(',').filter(Boolean),
  allowedDomains: (process.env.EMAIL_ALLOWED_DOMAINS || '').split(',').filter(Boolean),
  attachments: {
    maxSize: parseInt(process.env.EMAIL_MAX_ATTACHMENT_SIZE || '10485760', 10), // 10MB
    allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg', '.tif', '.tiff'],
  },
  ocr: {
    provider: process.env.OCR_PROVIDER || 'tesseract', // 'tesseract' or 'aws-textract'
    confidence: parseFloat(process.env.OCR_CONFIDENCE || '0.7'),
    awsRegion: process.env.AWS_REGION,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};
