import Joi from 'joi';
import { USER_ROLES, SERVICE_CATEGORIES, SUPPORTED_CURRENCIES } from './constants';

export const authValidation = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid(...Object.values(USER_ROLES)).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

export const userValidation = {
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email()
  }),

  addCoins: Joi.object({
    amount: Joi.number().min(10).max(100000).required(),
    paymentMethod: Joi.string().valid('upi', 'card', 'wallet').required()
  })
};

export const serviceValidation = {
  create: Joi.object({
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().min(10).max(500).required(),
    price: Joi.number().min(1).max(10000).required(),
    category: Joi.string().valid(...SERVICE_CATEGORIES).required(),
    features: Joi.array().items(Joi.string()).min(1).max(10)
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(100),
    description: Joi.string().min(10).max(500),
    price: Joi.number().min(1).max(10000),
    category: Joi.string().valid(...SERVICE_CATEGORIES),
    features: Joi.array().items(Joi.string()).min(1).max(10),
    status: Joi.string().valid('active', 'inactive')
  })
};

export const transactionValidation = {
  bookService: Joi.object({
    serviceId: Joi.string().uuid().required()
  })
};

export const conversionValidation = {
  create: Joi.object({
    amount: Joi.number().min(50).max(100000).required(),
    currency: Joi.string().valid(...SUPPORTED_CURRENCIES).required()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    reason: Joi.string().when('status', {
      is: 'rejected',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  })
};

export const adminValidation = {
  updateUserStatus: Joi.object({
    status: Joi.string().valid('active', 'suspended').required()
  }),

  updateUserRole: Joi.object({
    role: Joi.string().valid(...Object.values(USER_ROLES)).required()
  }),

  updateServiceStatus: Joi.object({
    status: Joi.string().valid('active', 'inactive', 'pending').required()
  })
};

export const paginationValidation = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  sortBy: Joi.string(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});