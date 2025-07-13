// src/lib/api.ts - Fixed with proper TypeScript types
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  pagination?: any;
}

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    walletBalance?: number;
  };
  token: string;
}

interface RegisterResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    walletBalance?: number;
  };
  token: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://coin-service-exchange-backend.bolt.run/api/v1';
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making API request to: ${url}`);
      console.log('Request config:', config);

      const response = await fetch(url, config);
      
      let data: ApiResponse<T>;
      
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Invalid response format from server');
      }

      console.log('API Response:', data);

      if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Network error occurred');
      }
    }
  }

  // Auth methods
  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<ApiResponse<RegisterResponse>> {
    try {
      const response = await this.request<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success && response.data?.token) {
        this.token = response.data.token;
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(credentials: { 
    email: string; 
    password: string; 
  }): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await this.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success && response.data?.token) {
        this.token = response.data.token;
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getProfile(): Promise<ApiResponse<any>> {
    return this.request('/auth/profile');
  }

  async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<any>> {
    return this.request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse<any>> {
    try {
      const response = await this.request('/auth/logout', { method: 'POST' });
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return response;
    } catch (error) {
      // Force logout even if API call fails
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  }

  // User methods
  async updateProfile(data: any): Promise<ApiResponse<any>> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getWalletBalance(): Promise<ApiResponse<{ balance: number; currency: string }>> {
    return this.request('/users/wallet');
  }

  // Service methods
  async getServices(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
    organizationId?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/services${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getServiceById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/services/${id}`);
  }

  async createService(serviceData: any): Promise<ApiResponse<any>> {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(id: string, serviceData: any): Promise<ApiResponse<any>> {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  async deleteService(id: string): Promise<ApiResponse<any>> {
    return this.request(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  async addServiceReview(id: string, reviewData: { rating: number; review?: string }): Promise<ApiResponse<any>> {
    return this.request(`/services/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async bookService(id: string): Promise<ApiResponse<any>> {
    return this.request(`/services/${id}/book`, {
      method: 'POST',
    });
  }

  // Payment methods
  async createPaymentOrder(data: { amount: number; purpose?: string }): Promise<ApiResponse<{
    orderId: string;
    amount: number;
    currency: string;
    receipt: string;
    paymentTransactionId: string;
    keyId: string;
  }>> {
    return this.request('/payments/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Transaction methods
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    userId?: string;
    serviceId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getTransactionById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/transactions/${id}`);
  }

  async getTransactionStats(): Promise<ApiResponse<any>> {
    return this.request('/transactions/stats');
  }

  async getUserTransactionHistory(params?: { page?: number; limit?: number }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/transactions/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // Conversion methods (for organizations)
  async createConversionRequest(data: {
    amount: number;
    bankDetails: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      bankName: string;
    };
  }): Promise<ApiResponse<any>> {
    return this.request('/conversions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConversionRequests(params?: { page?: number; limit?: number }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/conversions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getConversionRequestById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/conversions/${id}`);
  }

  // Admin methods
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.request('/admin/dashboard');
  }

  async getRecentActivity(limit?: number): Promise<ApiResponse<any>> {
    const endpoint = `/admin/activity${limit ? `?limit=${limit}` : ''}`;
    return this.request(endpoint);
  }

  async getSystemHealth(): Promise<ApiResponse<any>> {
    return this.request('/admin/health');
  }

  async approveService(id: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/services/${id}/approve`, {
      method: 'POST',
    });
  }

  async suspendUser(id: string, reason: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/users/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async reactivateUser(id: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/users/${id}/reactivate`, {
      method: 'POST',
    });
  }

  async approveConversionRequest(id: string, transactionId?: string): Promise<ApiResponse<any>> {
    return this.request(`/conversions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    });
  }

  async rejectConversionRequest(id: string, reason: string): Promise<ApiResponse<any>> {
    return this.request(`/conversions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/admin/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // Health check
  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api/v1', '')}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService;