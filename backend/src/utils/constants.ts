export const USER_ROLES = {
  USER: 'user',
  ORG: 'org',
  ADMIN: 'admin'
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive'
} as const;

export const SERVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
} as const;


export const CONVERSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSED: 'processed'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

export const PAYMENT_METHODS = {
  CARD: 'card',
  UPI: 'upi',
  WALLET: 'wallet',
  NETBANKING: 'netbanking'
} as const;

export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR'] as const;

export const SERVICE_CATEGORIES = [
  'technology',
  'business',
  'creative',
  'marketing',
  'consulting',
  'lifestyle',
  'travel',
  'health',
  'networking',
  'entertainment',
  'education',
  'finance',
  'design',
  'development'
] as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
} as const;

export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  APPROVE: 'approve',
  REJECT: 'reject',
  SUSPEND: 'suspend',
  ACTIVATE: 'activate'
} as const;

export const AUDIT_RESOURCES = {
  USER: 'user',
  SERVICE: 'service',
  CONVERSION: 'conversion',
  PAYMENT: 'payment'
} as const;

// Business rules
export const COIN_CONVERSION_RATE = 1; // 1 coin = 1 currency unit
export const MIN_COIN_PURCHASE = 10;
export const MIN_CONVERSION_AMOUNT = 50;
export const MAX_CONVERSION_AMOUNT = 100000;

// Rate limiting
export const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  PAYMENT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 3
  }
} as const;

// File upload constraints
export const FILE_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILES: 5
} as const;

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  VERIFICATION: 'verification',
  PASSWORD_RESET: 'password-reset',
  CONVERSION_APPROVED: 'conversion-approved',
  CONVERSION_REJECTED: 'conversion-rejected',
  SERVICE_BOOKED: 'service-booked',
  PAYMENT_SUCCESS: 'payment-success',
  PAYMENT_FAILED: 'payment-failed'
} as const;

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: (id: string) => `user:profile:${id}`,
  SERVICE_DETAILS: (id: string) => `service:details:${id}`,
  USER_SERVICES: (id: string) => `user:services:${id}`,
  DASHBOARD_STATS: 'dashboard:stats',
  FEATURED_SERVICES: 'services:featured'
} as const;

// API versions
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// Security
export const SECURITY = {
  BCRYPT_ROUNDS: 12,
  SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days
  PASSWORD_MIN_LENGTH: 8,
  API_KEY_LENGTH: 32
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
} as const;
