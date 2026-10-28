import { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboard/dashboard.service';
import { DashboardData } from '../../types/dashboard.types';

export const useDashboard = (params?: {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await dashboardService.getDashboardData(params);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [params?.startDate, params?.endDate, params?.departmentId]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchDashboardData,
  };
};
