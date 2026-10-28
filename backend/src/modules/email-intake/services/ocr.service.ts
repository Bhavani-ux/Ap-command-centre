import { createWorker } from 'tesseract.js';
import { emailIntakeConfig } from '../../../config/email-intake.config';
import { ExtractedInvoiceDataDto } from '../dto/email-intake.dto';

export class OCRService {
  async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    const worker = await createWorker('eng');

    try {
      const { data } = await worker.recognize(imageBuffer);
      return data.text;
    } finally {
      await worker.terminate();
    }
  }

  async extractInvoiceData(text: string): Promise<ExtractedInvoiceDataDto> {
    const extracted: ExtractedInvoiceDataDto = {
      confidence: 0,
    };

    // Extract invoice number
    const invoiceNumberMatch = text.match(
      /(?:invoice|inv|bill)[\s#:]*(\d+[-/]?\d*)/i
    );
    if (invoiceNumberMatch) {
      extracted.invoiceNumber = invoiceNumberMatch[1];
      extracted.confidence += 0.15;
    }

    // Extract vendor name (usually at the top)
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length > 0) {
      extracted.vendorName = lines[0].trim();
      extracted.confidence += 0.1;
    }

    // Extract email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      extracted.vendorEmail = emailMatch[0];
      extracted.confidence += 0.05;
    }

    // Extract dates
    const datePattern = /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/g;
    const dates = text.match(datePattern);
    if (dates && dates.length > 0) {
      extracted.invoiceDate = dates[0];
      extracted.confidence += 0.1;

      if (dates.length > 1) {
        extracted.dueDate = dates[1];
        extracted.confidence += 0.05;
      }
    }

    // Extract total amount
    const totalPatterns = [
      /(?:total|amount due|balance)[\s:]*\$?\s*([\d,]+\.?\d*)/i,
      /\$\s*([\d,]+\.\d{2})\s*(?:total|due)/i,
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        extracted.totalAmount = parseFloat(match[1].replace(/,/g, ''));
        extracted.confidence += 0.2;
        break;
      }
    }

    // Extract currency
    const currencyMatch = text.match(/\b(USD|EUR|GBP|CAD|AUD)\b/i);
    extracted.currency = currencyMatch ? currencyMatch[1].toUpperCase() : 'USD';

    // Extract PO number
    const poMatch = text.match(/(?:PO|purchase order)[\s#:]*(\d+[-/]?\d*)/i);
    if (poMatch) {
      extracted.poNumber = poMatch[1];
      extracted.confidence += 0.1;
    }

    // Extract line items (simplified)
    const lineItems: ExtractedInvoiceDataDto['lineItems'] = [];
    const lineItemPattern = /(.+?)\s+(\d+)\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)/g;
    let lineMatch;

    while ((lineMatch = lineItemPattern.exec(text)) !== null) {
      lineItems.push({
        description: lineMatch[1].trim(),
        quantity: parseInt(lineMatch[2], 10),
        unitPrice: parseFloat(lineMatch[3].replace(/,/g, '')),
        amount: parseFloat(lineMatch[4].replace(/,/g, '')),
      });
    }

    if (lineItems.length > 0) {
      extracted.lineItems = lineItems;
      extracted.confidence += 0.15;
    }

    // Extract tax
    const taxMatch = text.match(/(?:tax|vat|gst)[\s:]*\$?\s*([\d,]+\.?\d*)/i);
    if (taxMatch) {
      extracted.taxAmount = parseFloat(taxMatch[1].replace(/,/g, ''));
      extracted.confidence += 0.05;
    }

    // Extract subtotal
    const subtotalMatch = text.match(/(?:subtotal|sub-total)[\s:]*\$?\s*([\d,]+\.?\d*)/i);
    if (subtotalMatch) {
      extracted.subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''));
      extracted.confidence += 0.05;
    }

    // Normalize confidence to 0-1 range
    extracted.confidence = Math.min(extracted.confidence, 1.0);

    return extracted;
  }

  async extractFromPDF(pdfBuffer: Buffer): Promise<string> {
    // For PDF extraction, we would use pdf-parse or similar
    // This is a placeholder implementation
    // In production, use: const pdf = require('pdf-parse');
    throw new Error('PDF extraction not yet implemented. Use image formats or implement pdf-parse.');
  }

  isHighConfidence(confidence: number): boolean {
    return confidence >= emailIntakeConfig.ocr.confidence;
  }
}
