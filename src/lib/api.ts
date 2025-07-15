import { FirebaseAuthService } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// API Response Interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// HTTP Client Class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Get authentication token
  private async getAuthToken(): Promise<string | null> {
    return await FirebaseAuthService.getToken();
  }

  // Build headers with authentication
  private async getHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.getHeaders(options.headers as Record<string, string>);

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // File upload method
  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error(`File upload failed for ${endpoint}:`, error);
      throw error;
    }
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// API Service Methods
export const api = {
  // Authentication
  auth: {
    firebaseRegister: (userData: any) => 
      apiClient.post('/auth/firebase-register', userData),
    firebaseLogin: (userData: any) => 
      apiClient.post('/auth/firebase-login', userData),
    getProfile: () => 
      apiClient.get('/auth/profile'),
    updateProfile: (data: any) => 
      apiClient.put('/auth/profile', data),
    logout: () => 
      apiClient.post('/auth/logout'),
  },

  // User Management
  users: {
    getProfile: () => 
      apiClient.get('/users/profile'),
    updateProfile: (data: any) => 
      apiClient.put('/users/profile', data),
    getWalletBalance: () => 
      apiClient.get('/users/wallet'),
    getUserById: (id: string) => 
      apiClient.get(`/users/${id}`),
  },

  // Services
  services: {
    getAll: (params?: URLSearchParams) => 
      apiClient.get(`/services${params ? `?${params.toString()}` : ''}`),
    getById: (id: string) => 
      apiClient.get(`/services/${id}`),
    create: (data: any) => 
      apiClient.post('/services', data),
    update: (id: string, data: any) => 
      apiClient.put(`/services/${id}`, data),
    delete: (id: string) => 
      apiClient.delete(`/services/${id}`),
    book: (id: string, data: any) => 
      apiClient.post(`/services/${id}/book`, data),
    addReview: (id: string, data: any) => 
      apiClient.post(`/services/${id}/reviews`, data),
  },

  // Payments
  payments: {
    createOrder: (data: any) => 
      apiClient.post('/payments/orders', data),
    verifyPayment: (data: any) => 
      apiClient.post('/payments/verify', data),
    processRefund: (data: any) => 
      apiClient.post('/payments/refund', data),
  },

  // Transactions
  transactions: {
    getAll: (params?: URLSearchParams) => 
      apiClient.get(`/transactions${params ? `?${params.toString()}` : ''}`),
    getById: (id: string) => 
      apiClient.get(`/transactions/${id}`),
    getStats: () => 
      apiClient.get('/transactions/stats'),
    getHistory: (params?: URLSearchParams) => 
      apiClient.get(`/transactions/history${params ? `?${params.toString()}` : ''}`),
  },

  // Conversions (for organizations)
  conversions: {
    getAll: (params?: URLSearchParams) => 
      apiClient.get(`/conversions${params ? `?${params.toString()}` : ''}`),
    getById: (id: string) => 
      apiClient.get(`/conversions/${id}`),
    create: (data: any) => 
      apiClient.post('/conversions', data),
    approve: (id: string, data?: any) => 
      apiClient.post(`/conversions/${id}/approve`, data),
    reject: (id: string, data?: any) => 
      apiClient.post(`/conversions/${id}/reject`, data),
  },

  // Admin
  admin: {
    getDashboard: () => 
      apiClient.get('/admin/dashboard'),
    getRecentActivity: () => 
      apiClient.get('/admin/activity'),
    getSystemHealth: () => 
      apiClient.get('/admin/health'),
    getAuditLogs: (params?: URLSearchParams) => 
      apiClient.get(`/admin/audit-logs${params ? `?${params.toString()}` : ''}`),
    
    // User management
    suspendUser: (id: string, data?: any) => 
      apiClient.post(`/admin/users/${id}/suspend`, data),
    reactivateUser: (id: string, data?: any) => 
      apiClient.post(`/admin/users/${id}/reactivate`, data),
    
    // Service management
    approveService: (id: string, data?: any) => 
      apiClient.post(`/admin/services/${id}/approve`, data),
  },
};

// Utility functions for common API patterns
export const apiUtils = {
  // Handle API errors with user-friendly messages
  handleError: (error: any): string => {
    if (error.message) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'An unexpected error occurred';
  },

  // Build query parameters from object
  buildParams: (params: Record<string, any>): URLSearchParams => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    return searchParams;
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await FirebaseAuthService.getToken();
      return !!token;
    } catch {
      return false;
    }
  },

  // Refresh authentication token
  refreshToken: async (): Promise<string | null> => {
    try {
      return await FirebaseAuthService.getToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  },
};

// Export types for use in components
export type { ApiResponse };
export default api;