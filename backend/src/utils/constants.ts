export const USER_ROLES = {
  USER: 'user',
  ORG: 'org',
  ADMIN: 'admin'
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended'
} as const;

export const SERVICE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending'
} as const;

export const TRANSACTION_TYPES = {
  COIN_PURCHASE: 'coin_purchase',
  SERVICE_BOOKING: 'service_booking',
  COIN_CONVERSION: 'coin_conversion'
} as const;

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export const CONVERSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
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
  'entertainment'
] as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
} as const;

export const COIN_CONVERSION_RATE = 1; // 1 coin = 1 currency unit

export const MIN_COIN_PURCHASE = 10;
export const MIN_CONVERSION_AMOUNT = 50;