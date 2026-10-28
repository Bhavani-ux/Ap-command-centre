import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token is invalid or expired - clear storage and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        alert('Your session has expired. Please login again.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  me: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getRecentActivity: () => apiClient.get('/dashboard/recent-activity'),
};

// Invoices API
export const invoicesAPI = {
  getAll: (params?: any) => apiClient.get('/invoices', { params }),
  getById: (id: string) => apiClient.get(`/invoices/${id}`),
  create: (data: any) => apiClient.post('/invoices', data),
  update: (id: string, data: any) => apiClient.patch(`/invoices/${id}`, data),
};

// Approvals API
export const approvalsAPI = {
  getPending: () => apiClient.get('/approvals/pending'),
  approve: (id: string, comments?: string) =>
    apiClient.post(`/approvals/${id}/approve`, { comments }),
  reject: (id: string, comments: string) =>
    apiClient.post(`/approvals/${id}/reject`, { comments }),
  delegate: (id: string, delegateToId: string, comments?: string) =>
    apiClient.post(`/approvals/${id}/delegate`, { delegateToId, comments }),
  bulkApprove: (approvalIds: string[], comments?: string) =>
    apiClient.post('/approvals/bulk-approve', { approvalIds, comments }),
  bulkReject: (approvalIds: string[], comments: string) =>
    apiClient.post('/approvals/bulk-reject', { approvalIds, comments }),
};

// Vendors API
export const vendorsAPI = {
  getAll: () => apiClient.get('/vendors'),
};

// DOA Matrix API
export const doaMatrixAPI = {
  getAll: () => apiClient.get('/doa-matrix'),
};

// Users API
export const usersAPI = {
  getAll: () => apiClient.get('/users'),
  create: (data: any) => apiClient.post('/users', data),
  update: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
  searchAzure: (email: string) => apiClient.get('/users/azure-search', { params: { email } }),
  importAzure: (data: any) => apiClient.post('/users/azure-import', data),
};

// Roles API
export const rolesAPI = {
  getAll: () => apiClient.get('/roles'),
};

// Departments API
export const departmentsAPI = {
  getAll: () => apiClient.get('/departments'),
};
