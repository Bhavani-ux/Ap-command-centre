import { useState, useCallback } from 'react';
import approvalService from '../../services/approval/approval.service';
import {
  ApprovalItem,
  ApprovalHistory,
  ApprovalStats,
  ApprovalChain,
  Escalation,
  BulkApprovalResult,
  DOAMatrixRule,
  ApprovalFilters,
} from '../../types/approval.types';

export const useApproval = () => {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [doaMatrix, setDoaMatrix] = useState<DOAMatrixRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingApprovals = useCallback(async (filters?: ApprovalFilters) => {
    try {
      setLoading(true);
      setError(null);

      const result = await approvalService.getPendingApprovals(filters);
      setPendingApprovals(result);
    } catch (err) {
      setError('Failed to fetch pending approvals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveInvoice = useCallback(
    async (approvalId: string, comments?: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        await approvalService.approveInvoice(approvalId, comments);

        setPendingApprovals((prev) => prev.filter((item) => item.id !== approvalId));
      } catch (err) {
        setError('Failed to approve invoice');
        console.error(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const rejectInvoice = useCallback(
    async (approvalId: string, comments: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        await approvalService.rejectInvoice(approvalId, comments);

        setPendingApprovals((prev) => prev.filter((item) => item.id !== approvalId));
      } catch (err) {
        setError('Failed to reject invoice');
        console.error(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const requestInfo = useCallback(
    async (approvalId: string, comments: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        await approvalService.requestInfo(approvalId, comments);

        setPendingApprovals((prev) => prev.filter((item) => item.id !== approvalId));
      } catch (err) {
        setError('Failed to request information');
        console.error(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchApprovalHistory = useCallback(async (limit: number = 50) => {
    try {
      const result = await approvalService.getApprovalHistory(limit);
      setApprovalHistory(result);
    } catch (err) {
      console.error('Failed to fetch approval history:', err);
    }
  }, []);

  const fetchApprovalStats = useCallback(async () => {
    try {
      const result = await approvalService.getApprovalStats();
      setApprovalStats(result);
    } catch (err) {
      console.error('Failed to fetch approval stats:', err);
    }
  }, []);

  const getApprovalChain = useCallback(async (invoiceId: string): Promise<ApprovalChain | null> => {
    try {
      return await approvalService.getApprovalChain(invoiceId);
    } catch (err) {
      console.error('Failed to fetch approval chain:', err);
      return null;
    }
  }, []);

  const fetchEscalations = useCallback(async () => {
    try {
      const result = await approvalService.getEscalations();
      setEscalations(result);
    } catch (err) {
      console.error('Failed to fetch escalations:', err);
    }
  }, []);

  const escalateApproval = useCallback(
    async (approvalId: string, escalateToUserId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        await approvalService.escalateApproval(approvalId, escalateToUserId);

        await fetchEscalations();
      } catch (err) {
        setError('Failed to escalate approval');
        console.error(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchEscalations]
  );

  const bulkApprove = useCallback(
    async (invoiceIds: string[], comments?: string): Promise<BulkApprovalResult> => {
      try {
        setLoading(true);
        setError(null);

        const result = await approvalService.bulkApprove(invoiceIds, comments);

        await fetchPendingApprovals();

        return result;
      } catch (err) {
        setError('Failed to bulk approve');
        console.error(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchPendingApprovals]
  );

  const bulkReject = useCallback(
    async (invoiceIds: string[], comments: string): Promise<BulkApprovalResult> => {
      try {
        setLoading(true);
        setError(null);

        const result = await approvalService.bulkReject(invoiceIds, comments);

        await fetchPendingApprovals();

        return result;
      } catch (err) {
        setError('Failed to bulk reject');
        console.error(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchPendingApprovals]
  );

  const fetchDOAMatrix = useCallback(async () => {
    try {
      const result = await approvalService.getDOAMatrix();
      setDoaMatrix(result);
    } catch (err) {
      console.error('Failed to fetch DOA matrix:', err);
    }
  }, []);

  const createDOARule = useCallback(
    async (rule: Omit<DOAMatrixRule, 'id'>): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        await approvalService.createDOARule(rule);
        await fetchDOAMatrix();
      } catch (err) {
        setError('Failed to create DOA rule');
        console.error(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchDOAMatrix]
  );

  const updateDOARule = useCallback(
    async (ruleId: string, updates: Partial<DOAMatrixRule>): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        await approvalService.updateDOARule(ruleId, updates);
        await fetchDOAMatrix();
      } catch (err) {
        setError('Failed to update DOA rule');
        console.error(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchDOAMatrix]
  );

  const deleteDOARule = useCallback(
    async (ruleId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        await approvalService.deleteDOARule(ruleId);
        await fetchDOAMatrix();
      } catch (err) {
        setError('Failed to delete DOA rule');
        console.error(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchDOAMatrix]
  );

  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchPendingApprovals(),
      fetchApprovalStats(),
      fetchEscalations(),
    ]);
  }, [fetchPendingApprovals, fetchApprovalStats, fetchEscalations]);

  return {
    pendingApprovals,
    approvalHistory,
    approvalStats,
    escalations,
    doaMatrix,
    loading,
    error,
    fetchPendingApprovals,
    approveInvoice,
    rejectInvoice,
    requestInfo,
    fetchApprovalHistory,
    fetchApprovalStats,
    getApprovalChain,
    fetchEscalations,
    escalateApproval,
    bulkApprove,
    bulkReject,
    fetchDOAMatrix,
    createDOARule,
    updateDOARule,
    deleteDOARule,
    refreshData,
  };
};
