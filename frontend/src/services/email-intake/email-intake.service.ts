import { apiClient } from '../api/client';
import {
  EmailIntakeStats,
  EmailIntakeHistory,
  PendingReviewItem,
  ProcessEmailResult,
} from '../../types/email-intake.types';

export class EmailIntakeService {
  async processEmails(): Promise<ProcessEmailResult[]> {
    const response = await apiClient.post<{
      success: boolean;
      data: ProcessEmailResult[];
      message: string;
    }>('/email-intake/process');
    return response.data;
  }

  async getStats(): Promise<EmailIntakeStats> {
    const response = await apiClient.get<{ success: boolean; data: EmailIntakeStats }>(
      '/email-intake/stats'
    );
    return response.data;
  }

  async getHistory(limit: number = 50): Promise<EmailIntakeHistory[]> {
    const response = await apiClient.get<{ success: boolean; data: EmailIntakeHistory[] }>(
      `/email-intake/history?limit=${limit}`
    );
    return response.data;
  }

  async getPendingReview(): Promise<PendingReviewItem[]> {
    const response = await apiClient.get<{ success: boolean; data: PendingReviewItem[] }>(
      '/email-intake/pending-review'
    );
    return response.data;
  }
}

export const emailIntakeService = new EmailIntakeService();
