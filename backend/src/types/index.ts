export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'org' | 'admin';
  walletBalance: number;
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  organizationId: string;
  status: 'active' | 'inactive' | 'pending';
  features: string[];
  bookings: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  serviceId?: string;
  type: 'coin_purchase' | 'service_booking' | 'coin_conversion';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversionRequest {
  id: string;
  organizationId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  processedBy?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}