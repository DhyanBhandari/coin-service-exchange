// src/lib/api.ts - Updated with enhanced payment support
import { FirebaseAuthService } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// API Response Interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Payment specific interfaces
interface PaymentOrderData {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  paymentTransactionId: string;
  keyId: string;
}

interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  userLocation?: {
    country?: string;
    countryCode?: string;
    isIndia?: boolean;
  };
}

// HTTP Client Class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Get authentication token
  private async getAuthToken(): Promise<string | null> {
    try {
      return await FirebaseAuthService.getToken();
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
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

  // Generic request method with enhanced error handling
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

      // Handle different response types
      let data: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error: any) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      // Enhanced error handling for different scenarios
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      if (error.message.includes('401')) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      if (error.message.includes('403')) {
        throw new Error('You do not have permission to perform this action.');
      }
      
      if (error.message.includes('404')) {
        throw new Error('Resource not found.');
      }
      
      if (error.message.includes('500')) {
        throw new Error('Server error. Please try again later.');
      }
      
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
    
    // User bookings
    getBookings: (params?: URLSearchParams) => 
      apiClient.get(`/users/bookings${params ? `?${params.toString()}` : ''}`),
    getBookingById: (bookingId: string) => 
      apiClient.get(`/users/bookings/${bookingId}`),
    cancelBooking: (bookingId: string, data: any) => 
      apiClient.post(`/users/bookings/${bookingId}/cancel`, data),
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

  // Enhanced Payments with better error handling and location support
  payments: {
    createOrder: async (data: {
      amount: number;
      purpose: string;
      currency?: string;
      userLocation?: {
        country?: string;
        countryCode?: string;
        isIndia?: boolean;
      };
    }): Promise<ApiResponse<PaymentOrderData>> => {
      try {
        // Validate input
        if (!data.amount || data.amount <= 0) {
          throw new Error('Invalid amount. Amount must be greater than 0.');
        }

        const payload = {
          ...data,
          currency: data.currency || 'INR',
          userLocation: data.userLocation || { isIndia: true, countryCode: 'IN' }
        };

        return await apiClient.post('/payments/orders', payload);
      } catch (error: any) {
        console.error('Create payment order error:', error);
        throw error;
      }
    },
    
    verifyPayment: async (data: PaymentVerificationData): Promise<ApiResponse<any>> => {
      try {
        // Validate required fields
        if (!data.razorpay_order_id || !data.razorpay_payment_id || !data.razorpay_signature) {
          throw new Error('Missing required payment verification data');
        }

        return await apiClient.post('/payments/verify', data);
      } catch (error: any) {
        console.error('Payment verification error:', error);
        throw error;
      }
    },
    
    processRefund: (data: any) => 
      apiClient.post('/payments/refund', data),
    
    getPaymentMethods: () =>
      apiClient.get('/payments/methods'),
    
    savePaymentMethod: (data: any) =>
      apiClient.post('/payments/methods', data),
    
    deletePaymentMethod: (id: string) =>
      apiClient.delete(`/payments/methods/${id}`),
    
    getPaymentHistory: (params?: URLSearchParams) =>
      apiClient.get(`/payments/history${params ? `?${params.toString()}` : ''}`),
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

  // Health check
  health: {
    check: () => apiClient.get('/health'),
    ping: () => fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`).then(res => res.json()),
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

  // Format currency based on region
  formatCurrency: (amount: number, region: 'IN' | 'US' = 'IN'): string => {
    const formatter = new Intl.NumberFormat(region === 'IN' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: region === 'IN' ? 'INR' : 'USD',
    });
    return formatter.format(amount);
  },

  // Get user location
  getUserLocation: async (): Promise<{
    country: string;
    countryCode: string;
    isIndia: boolean;
  }> => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        country: data.country_name || 'India',
        countryCode: data.country_code || 'IN',
        isIndia: data.country_code === 'IN'
      };
    } catch (error) {
      console.error('Failed to get user location:', error);
      return {
        country: 'India',
        countryCode: 'IN',
        isIndia: true
      };
    }
  },
};

// Export types for use in components
export type { ApiResponse, PaymentOrderData, PaymentVerificationData };
export default api;