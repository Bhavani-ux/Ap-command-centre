import { useState, useEffect, useCallback } from 'react';
import invoiceTrackerService from '../../services/invoice-tracker/invoice-tracker.service';
import {
  InvoiceTrackerQuery,
  InvoiceTrackerItem,
  InvoiceDetail,
  InvoicePipelineStats,
  InvoiceAgingBucket,
  InvoiceListResponse,
  BulkActionResult,
} from '../../types/invoice-tracker.types';

export const useInvoiceTracker = () => {
  const [invoices, setInvoices] = useState<InvoiceTrackerItem[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [pipelineStats, setPipelineStats] = useState<InvoicePipelineStats | null>(null);
  const [agingReport, setAgingReport] = useState<InvoiceAgingBucket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
  }>({
    total: 0,
    page: 1,
    limit: 20,
  });

  const fetchInvoices = useCallback(async (query: InvoiceTrackerQuery = {}) => {
    try {
      setLoading(true);
      setError(null);

      const result = await invoiceTrackerService.getInvoices(query);
      setInvoices(result.items);
      setPagination({
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err) {
      setError('Failed to fetch invoices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoiceDetail = useCallback(async (invoiceId: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await invoiceTrackerService.getInvoiceDetail(invoiceId);
      setSelectedInvoice(result);
    } catch (err) {
      setError('Failed to fetch invoice details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPipelineStats = useCallback(async () => {
    try {
      const result = await invoiceTrackerService.getPipelineStats();
      setPipelineStats(result);
    } catch (err) {
      console.error('Failed to fetch pipeline stats:', err);
    }
  }, []);

  const fetchAgingReport = useCallback(async () => {
    try {
      const result = await invoiceTrackerService.getAgingReport();
      setAgingReport(result);
    } catch (err) {
      console.error('Failed to fetch aging report:', err);
    }
  }, []);

  const bulkUpdateStatus = useCallback(
    async (invoiceIds: string[], status: string): Promise<BulkActionResult> => {
      try {
        setLoading(true);
        setError(null);

        const result = await invoiceTrackerService.bulkUpdateStatus(invoiceIds, status);

        if (result.success) {
          await fetchInvoices({ page: pagination.page, limit: pagination.limit });
        }

        return result;
      } catch (err) {
        setError('Failed to update invoice statuses');
        console.error(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchInvoices, pagination]
  );

  const getInvoicesByVendor = useCallback(
    async (vendorId: string, limit: number = 10): Promise<InvoiceTrackerItem[]> => {
      try {
        return await invoiceTrackerService.getInvoicesByVendor(vendorId, limit);
      } catch (err) {
        console.error('Failed to fetch vendor invoices:', err);
        return [];
      }
    },
    []
  );

  const clearSelectedInvoice = useCallback(() => {
    setSelectedInvoice(null);
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchInvoices({ page: pagination.page, limit: pagination.limit }),
      fetchPipelineStats(),
      fetchAgingReport(),
    ]);
  }, [fetchInvoices, fetchPipelineStats, fetchAgingReport, pagination]);

  return {
    invoices,
    selectedInvoice,
    pipelineStats,
    agingReport,
    loading,
    error,
    pagination,
    fetchInvoices,
    fetchInvoiceDetail,
    fetchPipelineStats,
    fetchAgingReport,
    bulkUpdateStatus,
    getInvoicesByVendor,
    clearSelectedInvoice,
    refreshData,
  };
};
