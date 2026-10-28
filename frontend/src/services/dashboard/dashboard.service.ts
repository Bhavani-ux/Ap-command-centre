import { apiClient } from '../api/client';
import { DashboardData } from '../../types/dashboard.types';

export class DashboardService {
  async getDashboardData(params?: {
    startDate?: string;
    endDate?: string;
    departmentId?: string;
  }): Promise<DashboardData> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);

    const query = queryParams.toString();
    const url = `/dashboard${query ? `?${query}` : ''}`;

    const response = await apiClient.get<{ success: boolean; data: DashboardData }>(url);
    return response.data;
  }
}

export const dashboardService = new DashboardService();
