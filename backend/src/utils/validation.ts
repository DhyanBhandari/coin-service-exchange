import Joi from 'joi';

// Traditional authentication schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('user', 'org').default('user'),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

export const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

// Firebase authentication schemas
export const firebaseRegisterSchema = Joi.object({
  uid: Joi.string().required(),
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('user', 'org').default('user'),
  emailVerified: Joi.boolean().default(false),
});

export const firebaseLoginSchema = Joi.object({
  uid: Joi.string().required(),
  email: Joi.string().email().required(),
  emailVerified: Joi.boolean().default(false),
});

// User schemas
export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[+]?[1-9][\d]{1,14}$/),
  address: Joi.string().max(500),
});

// Service schemas
export const createServiceSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  category: Joi.string().valid(
    'accommodation',
    'travel',
    'food',
    'technology',
    'events',
    'entertainment',
    'other'
  ).required(),
  price: Joi.number().integer().min(1).max(10000).required(),
  location: Joi.string().max(200),
  duration: Joi.string().max(100),
  capacity: Joi.number().integer().min(1).max(1000),
  tags: Joi.array().items(Joi.string().max(50)).max(10),
  images: Joi.array().items(Joi.string().uri()).max(5),
  isActive: Joi.boolean().default(true),
});

export const updateServiceSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  description: Joi.string().min(10).max(2000),
  category: Joi.string().valid(
    'accommodation',
    'travel',
    'food',
    'technology',
    'events',
    'entertainment',
    'other'
  ),
  price: Joi.number().integer().min(1).max(10000),
  location: Joi.string().max(200),
  duration: Joi.string().max(100),
  capacity: Joi.number().integer().min(1).max(1000),
  tags: Joi.array().items(Joi.string().max(50)).max(10),
  images: Joi.array().items(Joi.string().uri()).max(5),
  isActive: Joi.boolean(),
});

export const bookServiceSchema = Joi.object({
  serviceId: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(1).max(100).default(1),
  notes: Joi.string().max(500),
  contactInfo: Joi.object({
    phone: Joi.string().pattern(/^[+]?[1-9][\d]{1,14}$/),
    email: Joi.string().email(),
    preferredContact: Joi.string().valid('phone', 'email').default('email'),
  }),
});

export const addReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().min(10).max(1000).required(),
  isAnonymous: Joi.boolean().default(false),
});

// Payment schemas
export const createPaymentOrderSchema = Joi.object({
  amount: Joi.number().integer().min(1).max(100000).required(),
  currency: Joi.string().valid('INR').default('INR'),
  purpose: Joi.string().valid('coins_purchase', 'service_payment').required(),
  metadata: Joi.object(),
});

export const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

export const refundPaymentSchema = Joi.object({
  paymentId: Joi.string().required(),
  amount: Joi.number().integer().min(1),
  reason: Joi.string().max(500),
});

// Conversion schemas
export const createConversionSchema = Joi.object({
  amount: Joi.number().integer().min(100).max(50000).required(),
  bankDetails: Joi.object({
    accountNumber: Joi.string().pattern(/^[0-9]{9,18}$/).required(),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
    accountHolderName: Joi.string().min(2).max(100).required(),
    bankName: Joi.string().min(2).max(100).required(),
  }).required(),
  notes: Joi.string().max(500),
});

export const processConversionSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  adminNotes: Joi.string().max(500),
  transactionId: Joi.string().max(100),
});

// Query parameter schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().max(50),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const serviceFilterSchema = Joi.object({
  category: Joi.string().valid(
    'accommodation',
    'travel',
    'food',
    'technology',
    'events',
    'entertainment',
    'other'
  ),
  minPrice: Joi.number().integer().min(0),
  maxPrice: Joi.number().integer().min(0),
  location: Joi.string().max(200),
  isActive: Joi.boolean(),
  search: Joi.string().max(100),
}).concat(paginationSchema);

export const transactionFilterSchema = Joi.object({
  type: Joi.string().valid('credit', 'debit'),
  status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled'),
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso(),
  minAmount: Joi.number().min(0),
  maxAmount: Joi.number().min(0),
}).concat(paginationSchema);

export const conversionFilterSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'completed'),
  fromDate: Joi.date().iso(),
  toDate: Joi.date().iso(),
  minAmount: Joi.number().min(0),
  maxAmount: Joi.number().min(0),
}).concat(paginationSchema);

// Admin schemas
export const userManagementSchema = Joi.object({
  action: Joi.string().valid('suspend', 'reactivate').required(),
  reason: Joi.string().max(500),
  duration: Joi.number().integer().min(1).max(365), // days
});

export const serviceApprovalSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  adminNotes: Joi.string().max(500),
});

// File upload schemas
export const fileUploadSchema = Joi.object({
  fieldname: Joi.string().required(),
  originalname: Joi.string().required(),
  mimetype: Joi.string().valid(
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf'
  ).required(),
  size: Joi.number().max(5 * 1024 * 1024), // 5MB max
});

// API key schemas
export const createApiKeySchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  permissions: Joi.array().items(
    Joi.string().valid('read', 'write', 'admin')
  ).min(1).required(),
  expiresAt: Joi.date().iso().greater('now'),
  isActive: Joi.boolean().default(true),
});