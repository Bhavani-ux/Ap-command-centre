import { useState } from 'react';
import { emailIntakeService } from '../../services/email-intake/email-intake.service';
import {
  EmailIntakeStats,
  EmailIntakeHistory,
  PendingReviewItem,
  ProcessEmailResult,
} from '../../types/email-intake.types';

export const useEmailIntake = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processEmails = async (): Promise<ProcessEmailResult[]> => {
    setIsProcessing(true);
    setError(null);

    try {
      const results = await emailIntakeService.processEmails();
      return results;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to process emails';
      setError(errorMsg);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const getStats = async (): Promise<EmailIntakeStats | null> => {
    try {
      return await emailIntakeService.getStats();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load stats';
      setError(errorMsg);
      return null;
    }
  };

  const getHistory = async (limit?: number): Promise<EmailIntakeHistory[]> => {
    try {
      return await emailIntakeService.getHistory(limit);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load history';
      setError(errorMsg);
      return [];
    }
  };

  const getPendingReview = async (): Promise<PendingReviewItem[]> => {
    try {
      return await emailIntakeService.getPendingReview();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load pending items';
      setError(errorMsg);
      return [];
    }
  };

  return {
    isProcessing,
    error,
    processEmails,
    getStats,
    getHistory,
    getPendingReview,
  };
};
