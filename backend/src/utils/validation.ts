import Joi from 'joi';
import { SERVICE_CATEGORIES, USER_ROLES } from './constants';

export const validationSchemas = {
  # Auth schemas
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }),
    role: Joi.string().valid(...Object.values(USER_ROLES)).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updatePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')).required()
  }),

  # User schemas
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^[+]?[1-9]\\d{1,14}$/).optional(),
    address: Joi.object({
      street: Joi.string().max(200).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      country: Joi.string().max(100).optional(),
      zipCode: Joi.string().max(20).optional()
    }).optional(),
    preferences: Joi.object({
      notifications: Joi.boolean().optional(),
      newsletter: Joi.boolean().optional(),
      language: Joi.string().valid('en', 'hi', 'es', 'fr').optional()
    }).optional(),
    profileImage: Joi.string().uri().optional()
  }),

  # Service schemas
  createService: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(20).max(2000).required(),
    price: Joi.number().min(1).max(1000000).required(),
    category: Joi.string().valid(...SERVICE_CATEGORIES).required(),
    features: Joi.array().items(Joi.string().min(1).max(100)).min(1).max(20).required(),
    images: Joi.array().items(Joi.string().uri()).max(10).optional(),
    tags: Joi.array().items(Joi.string().min(1).max(50)).max(10).optional(),
    metadata: Joi.object().optional()
  }),

  updateService: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().min(20).max(2000).optional(),
    price: Joi.number().min(1).max(1000000).optional(),
    category: Joi.string().valid(...SERVICE_CATEGORIES).optional(),
    features: Joi.array().items(Joi.string().min(1).max(100)).min(1).max(20).optional(),
    images: Joi.array().items(Joi.string().uri()).max(10).optional(),
    tags: Joi.array().items(Joi.string().min(1).max(50)).max(10).optional(),
    metadata: Joi.object().optional()
  }),

  addReview: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    review: Joi.string().min(10).max(1000).optional()
  }),

  # Payment schemas
  createPaymentOrder: Joi.object({
    amount: Joi.number().min(10).max(1000000).required(),
    purpose: Joi.string().valid('coin_purchase', 'service_booking').optional()
  }),

  verifyPayment: Joi.object({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required()
  }),

  processRefund: Joi.object({
    paymentId: Joi.string().required(),
    amount: Joi.number().min(1).optional(),
    reason: Joi.string().max(500).optional()
  }),

  # Conversion schemas
  createConversionRequest: Joi.object({
    amount: Joi.number().min(50).max(100000).required(),
    bankDetails: Joi.object({
      accountNumber: Joi.string().pattern(/^\\d{9,18}$/).required(),
      ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
      accountHolderName: Joi.string().min(2).max(100).required(),
      bankName: Joi.string().min(2).max(100).required()
    }).required()
  }),

  approveConversionRequest: Joi.object({
    transactionId: Joi.string().max(100).optional(),
    notes: Joi.string().max(500).optional()
  }),

  rejectConversionRequest: Joi.object({
    reason: Joi.string().min(10).max(500).required()
  }),

  # Query parameter schemas
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  }),

  servicesQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    category: Joi.string().valid(...SERVICE_CATEGORIES).optional(),
    search: Joi.string().min(2).max(100).optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    status: Joi.string().valid('active', 'inactive', 'pending', 'suspended').optional(),
    organizationId: Joi.string().uuid().optional(),
    sortBy: Joi.string().valid('createdAt', 'price', 'rating', 'bookings').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  }),

  transactionsQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    type: Joi.string().valid('coin_purchase', 'service_booking', 'coin_conversion', 'refund').optional(),
    status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled').optional(),
    userId: Joi.string().uuid().optional(),
    serviceId: Joi.string().uuid().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional()
  }),

  auditLogsQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    userId: Joi.string().uuid().optional(),
    action: Joi.string().optional(),
    resource: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional()
  }),

  # Parameter schemas
  uuidParam: Joi.object({
    id: Joi.string().uuid().required()
  }),

  # Admin schemas
  suspendUser: Joi.object({
    reason: Joi.string().min(10).max(500).required()
  }),

  recentActivity: Joi.object({
    limit: Joi.number().integer().min(1).max(50).optional()
  })
};

# Custom validation functions
export const validateUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9]\\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const validateIFSC = (ifsc: string): boolean => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc);
};

export const validateAccountNumber = (accountNumber: string): boolean => {
  const accountRegex = /^\\d{9,18}$/;
  return accountRegex.test(accountNumber);
};

export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};
