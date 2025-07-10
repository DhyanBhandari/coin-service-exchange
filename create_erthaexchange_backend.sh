#!/bin/bash

# Define the base directory for the backend
BASE_DIR="backend"

# Create the base directory
mkdir -p "$BASE_DIR"
cd "$BASE_DIR" || exit

echo "Creating project structure and files..."

# Create src directories
mkdir -p src/{config,controllers,middleware,models,routes,services,types,utils}

# Create migrations directory
mkdir -p migrations

# Create scripts directory
mkdir -p scripts

# 1. package.json
cat << 'EOF' > package.json
{
  "name": "erthaexchange-backend",
  "version": "1.0.0",
  "description": "Backend for ErthaExchange platform",
  "main": "dist/app.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "lint": "eslint src/**/*.ts",
    "test": "jest",
    "seed": "ts-node scripts/seed.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.38.5",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "drizzle-orm": "^0.29.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "razorpay": "^2.9.2",
    "helmet": "^7.1.0",
    "joi": "^17.11.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "postgres": "^3.4.3",
    "uuid": "^9.0.1",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "crypto": "^1.0.1",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.4",
    "@types/pg": "^8.10.9",
    "@types/uuid": "^9.0.7",
    "@types/multer": "^1.4.11",
    "@typescript-eslint/eslint-plugin": "^6.13.2",
    "@typescript-eslint/parser": "^6.13.2",
    "drizzle-kit": "^0.20.4",
    "eslint": "^8.55.0",
    "jest": "^29.7.0",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.1",
    "typescript": "^5.3.3"
  }
}
EOF

# 2. .env.example
cat << 'EOF' > .env.example
# Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxx

# Payment Configuration
PAYMENT_CURRENCY=INR
MIN_PAYMENT_AMOUNT=10
MAX_PAYMENT_AMOUNT=1000000

# Logging
LOG_LEVEL=info

# Admin Configuration
ADMIN_EMAIL=admin@erthaexchange.com
ADMIN_PASSWORD=admin123
EOF

# 3. src/config/database.ts
cat << 'EOF' > src/config/database.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/models/schema';
import { logger } from '@/utils/logger';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 60,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(client, { 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

export type Database = typeof db;

// Test database connection
export const testConnection = async () => {
  try {
    await client`SELECT 1`;
    logger.info('Database connected successfully');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};
EOF

# 3. src/config/supabase.ts
cat << 'EOF' > src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and Service Role Key are required');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    logger.info('Supabase connected successfully');
    return true;
  } catch (error) {
    logger.error('Supabase connection failed:', error);
    return false;
  }
};
EOF

# 3. src/config/razorpay.ts
cat << 'EOF' > src/config/razorpay.ts
import Razorpay from 'razorpay';
import { logger } from '@/utils/logger';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  logger.warn('Razorpay credentials not provided. Payment functionality will be limited.');
}

export const razorpay = new Razorpay({
  key_id: razorpayKeyId || 'rzp_test_demo',
  key_secret: razorpayKeySecret || 'demo_secret_key',
});

export const razorpayConfig = {
  keyId: razorpayKeyId || 'rzp_test_demo',
  keySecret: razorpayKeySecret || 'demo_secret_key',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'demo_webhook_secret',
  currency: process.env.PAYMENT_CURRENCY || 'INR',
  minAmount: parseInt(process.env.MIN_PAYMENT_AMOUNT || '10'),
  maxAmount: parseInt(process.env.MAX_PAYMENT_AMOUNT || '1000000'),
};

// Test Razorpay connection
export const testRazorpayConnection = async () => {
  try {
    if (!razorpayKeyId || !razorpayKeySecret) {
      logger.warn('Razorpay credentials not configured - using demo mode');
      return true;
    }
    
    // Try to create a test order to verify credentials
    const testOrder = await razorpay.orders.create({
      amount: 100, // ₹1
      currency: 'INR',
      receipt: 'test_receipt_' + Date.now(),
    });
    
    if (testOrder.id) {
      logger.info('Razorpay connected successfully');
      return true;
    }
  } catch (error) {
    logger.error('Razorpay connection failed:', error);
    return false;
  }
};
EOF

# 4. src/models/schema.ts
cat << 'EOF' > src/models/schema.ts
import { pgTable, text, integer, timestamp, boolean, json, decimal, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'), // user, org, admin
  walletBalance: decimal('wallet_balance', { precision: 12, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('active'), // active, suspended, inactive
  emailVerified: boolean('email_verified').notNull().default(false),
  profileImage: text('profile_image'),
  phone: text('phone'),
  address: json('address').$type<{
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  }>(),
  preferences: json('preferences').$type<{
    notifications?: boolean;
    newsletter?: boolean;
    language?: string;
  }>().default({}),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
  statusIdx: index('users_status_idx').on(table.status),
}));

// Services table
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  organizationId: uuid('organization_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // active, inactive, pending, suspended
  features: json('features').$type<string[]>().notNull().default([]),
  images: json('images').$type<string[]>().default([]),
  tags: json('tags').$type<string[]>().default([]),
  bookings: integer('bookings').notNull().default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  orgIdx: index('services_org_idx').on(table.organizationId),
  categoryIdx: index('services_category_idx').on(table.category),
  statusIdx: index('services_status_idx').on(table.status),
  createdAtIdx: index('services_created_at_idx').on(table.createdAt),
}));

// Transactions table
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),
  type: text('type').notNull(), // coin_purchase, service_booking, coin_conversion, refund
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'), // pending, completed, failed, cancelled
  description: text('description').notNull(),
  metadata: json('metadata').$type<Record<string, any>>(),
  paymentId: text('payment_id'),
  paymentMethod: text('payment_method'),
  balanceBefore: decimal('balance_before', { precision: 12, scale: 2 }),
  balanceAfter: decimal('balance_after', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  userIdx: index('transactions_user_idx').on(table.userId),
  serviceIdx: index('transactions_service_idx').on(table.serviceId),
  typeIdx: index('transactions_type_idx').on(table.type),
  statusIdx: index('transactions_status_idx').on(table.status),
  createdAtIdx: index('transactions_created_at_idx').on(table.createdAt),
}));

// Conversion requests table
export const conversionRequests = pgTable('conversion_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('INR'),
  status: text('status').notNull().default('pending'), // pending, approved, rejected, processed
  reason: text('reason'),
  processedBy: uuid('processed_by').references(() => users.id, { onDelete: 'set null' }),
  processedAt: timestamp('processed_at'),
  bankDetails: json('bank_details').$type<{
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    bankName?: string;
  }>(),
  transactionId: text('transaction_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  orgIdx: index('conversion_requests_org_idx').on(table.organizationId),
  statusIdx: index('conversion_requests_status_idx').on(table.status),
  createdAtIdx: index('conversion_requests_created_at_idx').on(table.createdAt),
}));

// Payment methods table
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // card, upi, wallet, netbanking
  provider: text('provider').notNull(), // razorpay, gpay, paytm, etc.
  isDefault: boolean('is_default').notNull().default(false),
  details: json('details').$type<{
    last4?: string;
    cardType?: string;
    upiId?: string;
    walletProvider?: string;
    holderName?: string;
    expiryMonth?: string;
    expiryYear?: string;
  }>(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  userIdx: index('payment_methods_user_idx').on(table.userId),
  typeIdx: index('payment_methods_type_idx').on(table.type),
}));

// Payment transactions table
export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id, { onDelete: 'set null' }),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  razorpaySignature: text('razorpay_signature'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('INR'),
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed, cancelled
  paymentMethod: text('payment_method').notNull(),
  provider: text('provider'),
  gateway: text('gateway').notNull().default('razorpay'),
  gatewayResponse: json('gateway_response'),
  failureReason: text('failure_reason'),
  refundId: text('refund_id'),
  refundAmount: decimal('refund_amount', { precision: 12, scale: 2 }),
  refundStatus: text('refund_status'), // pending, processed, failed
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  userIdx: index('payment_transactions_user_idx').on(table.userId),
  razorpayOrderIdx: index('payment_transactions_order_idx').on(table.razorpayOrderId),
  statusIdx: index('payment_transactions_status_idx').on(table.status),
  createdAtIdx: index('payment_transactions_created_at_idx').on(table.createdAt),
}));

// Service reviews table
export const serviceReviews = pgTable('service_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5
  review: text('review'),
  isVisible: boolean('is_visible').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  serviceIdx: index('service_reviews_service_idx').on(table.serviceId),
  userIdx: index('service_reviews_user_idx').on(table.userId),
  ratingIdx: index('service_reviews_rating_idx').on(table.rating),
}));

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resource_id'),
  oldValues: json('old_values'),
  newValues: json('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  userIdx: index('audit_logs_user_idx').on(table.userId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  resourceIdx: index('audit_logs_resource_idx').on(table.resource),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));

// API keys table for external integrations
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  permissions: json('permissions').$type<string[]>().default([]),
  isActive: boolean('is_active').notNull().default(true),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  userIdx: index('api_keys_user_idx').on(table.userId),
  keyIdx: uniqueIndex('api_keys_key_idx').on(table.key),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  services: many(services),
  transactions: many(transactions),
  conversionRequests: many(conversionRequests),
  paymentMethods: many(paymentMethods),
  paymentTransactions: many(paymentTransactions),
  serviceReviews: many(serviceReviews),
  auditLogs: many(auditLogs),
  apiKeys: many(apiKeys),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  organization: one(users, {
    fields: [services.organizationId],
    references: [users.id]
  }),
  transactions: many(transactions),
  reviews: many(serviceReviews),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id]
  }),
  service: one(services, {
    fields: [transactions.serviceId],
    references: [services.id]
  }),
}));

export const conversionRequestsRelations = relations(conversionRequests, ({ one }) => ({
  organization: one(users, {
    fields: [conversionRequests.organizationId],
    references: [users.id]
  }),
  processedBy: one(users, {
    fields: [conversionRequests.processedBy],
    references: [users.id]
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one, many }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id]
  }),
  paymentTransactions: many(paymentTransactions),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  user: one(users, {
    fields: [paymentTransactions.userId],
    references: [users.id]
  }),
  transaction: one(transactions, {
    fields: [paymentTransactions.transactionId],
    references: [transactions.id]
  }),
  paymentMethod: one(paymentMethods, {
    fields: [paymentTransactions.paymentMethodId],
    references: [paymentMethods.id]
  }),
}));

export const serviceReviewsRelations = relations(serviceReviews, ({ one }) => ({
  service: one(services, {
    fields: [serviceReviews.serviceId],
    references: [services.id]
  }),
  user: one(users, {
    fields: [serviceReviews.userId],
    references: [users.id]
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id]
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id]
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type ConversionRequest = typeof conversionRequests.$inferSelect;
export type NewConversionRequest = typeof conversionRequests.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;
export type ServiceReview = typeof serviceReviews.$inferSelect;
export type NewServiceReview = typeof serviceReviews.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
EOF

# 5. src/types/index.ts
cat << 'EOF' > src/types/index.ts
import { Request } from 'express';
import { User } from '@/models/schema';

export interface AuthRequest extends Request {
  user?: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  pagination?: PaginationInfo;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaymentOrderData {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  paymentTransactionId: string;
  keyId: string;
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface ServiceFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  organizationId?: string;
}

export interface TransactionFilters {
  type?: string;
  status?: string;
  userId?: string;
  serviceId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalOrganizations: number;
}

export interface ServiceStats {
  totalServices: number;
  activeServices: number;
  pendingServices: number;
  totalBookings: number;
}

export interface FinancialStats {
  totalCoinsInCirculation: number;
  totalRevenue: number;
  pendingConversions: number;
  thisMonthRevenue: number;
}

export interface DashboardStats {
  users: UserStats;
  services: ServiceStats;
  financial: FinancialStats;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: Record<string, any>;
}

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface FileUploadData {
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  key: string;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  location?: string;
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
  }
}
EOF

# 6. src/utils/constants.ts
cat << 'EOF' > src/utils/constants.ts
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

export const TRANSACTION_TYPES = {
  COIN_PURCHASE: 'coin_purchase',
  SERVICE_BOOKING: 'service_booking',
  COIN_CONVERSION: 'coin_conversion',
  REFUND: 'refund'
} as const;

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
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
  TRANSACTION: 'transaction',
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
  JWT_ALGORITHM: 'HS256',
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
EOF

# 6. src/utils/helpers.ts
cat << 'EOF' > src/utils/helpers.ts
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ApiResponse, PaginationInfo, AppError } from '@/types';
import { SECURITY } from './constants';

export const generateId = (): string => uuidv4();

export const generateApiKey = (): string => {
  return crypto.randomBytes(SECURITY.API_KEY_LENGTH).toString('hex');
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: SECURITY.JWT_ALGORITHM as jwt.Algorithm
  });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

export const createApiResponse = <T>(
  success: boolean,
  message: string,
  data?: T,
  error?: string,
  pagination?: PaginationInfo
): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    success,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== undefined) response.data = data;
  if (error) response.error = error;
  if (pagination) response.pagination = pagination;

  return response;
};

export const calculatePagination = (
  page: number,
  limit: number,
  total: number
): PaginationInfo => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev
  };
};

export const validatePaginationParams = (
  page?: string | number,
  limit?: string | number
): { page: number; limit: number } => {
  const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page || 1;
  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit || 10;

  return {
    page: Math.max(1, parsedPage),
    limit: Math.min(100, Math.max(1, parsedLimit))
  };
};

export const sanitizeUser = (user: any) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

export const generateOrderId = (): string => {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatCurrency = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€'
  };
  return `${symbols[currency] || currency}${amount.toFixed(2)}`;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= SECURITY.PASSWORD_MIN_LENGTH;
};

export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const parseBoolean = (value: string | boolean | undefined): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return false;
};

export const parseNumber = (value: string | number | undefined, defaultValue: number = 0): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

export const truncate = (text: string, length: number = 100): string => {
  if (text.length <= length) return text;
  return text.substr(0, length) + '...';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getClientIp = (req: any): string => {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         'unknown';
};

export const getUserAgent = (req: any): string => {
  return req.headers['user-agent'] || 'unknown';
};

export const validateUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await delay(delayMs * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  
  throw lastError!;
};

export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.slice(0, 2) + '*'.repeat(localPart.length - 2);
  return `${maskedLocal}@${domain}`;
};

export const maskPhoneNumber = (phone: string): string => {
  if (phone.length < 4) return phone;
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
};

export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const safeJsonParse = <T>(json: string, defaultValue: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  return new AppError(message, statusCode);
};
EOF

# 6. src/utils/logger.ts
cat << 'EOF' > src/utils/logger.ts
import winston from 'winston';
import { isDevelopment } from './helpers';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${stack || ''} ${metaStr}`;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isDevelopment() ? devFormat : logFormat,
  defaultMeta: { service: 'erthaexchange-backend' },
  transports: [
    new winston.transports.Console({
      silent: process.env.NODE_ENV === 'test'
    })
  ]
});

// Add file transport for production
if (!isDevelopment()) {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));

  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
}

export default logger;
EOF

# 7. src/middleware/auth.middleware.ts
cat << 'EOF' > src/middleware/auth.middleware.ts
import { Response, NextFunction } from 'express';
import { verifyToken, createApiResponse } from '@/utils/helpers';
import { db } from '@/config/database';
import { users } from '@/models/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '@/types';
import { USER_STATUS } from '@/utils/constants';
import { logger } from '@/utils/logger';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json(
        createApiResponse(false, 'Access token is required')
      );
      return;
    }

    const decoded = verifyToken(token);
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      res.status(401).json(
        createApiResponse(false, 'Invalid token - user not found')
      );
      return;
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      res.status(403).json(
        createApiResponse(false, `Account is ${user.status}`)
      );
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json(
      createApiResponse(false, 'Invalid or expired token')
    );
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = verifyToken(token);
        
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, decoded.userId))
          .limit(1);

        if (user && user.status === USER_STATUS.ACTIVE) {
          req.user = user;
        }
      } catch (error) {
        // Continue without user if token is invalid
        logger.warn('Optional auth failed:', error);
      }
    }

    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

export const validateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      res.status(401).json(
        createApiResponse(false, 'API key is required')
      );
      return;
    }

    # TODO: Implement API key validation
    # For now, we'll skip this functionality
    next();
  } catch (error) {
    logger.error('API key validation error:', error);
    res.status(401).json(
      createApiResponse(false, 'Invalid API key')
    );
  }
};
EOF

# 7. src/middleware/role.middleware.ts
cat << 'EOF' > src/middleware/role.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { createApiResponse } from '@/utils/helpers';
import { USER_ROLES } from '@/utils/constants';

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(
        createApiResponse(false, 'Authentication required')
      );
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json(
        createApiResponse(false, 'Insufficient permissions')
      );
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole([USER_ROLES.ADMIN]);
export const requireOrg = requireRole([USER_ROLES.ORG]);
export const requireUser = requireRole([USER_ROLES.USER]);
export const requireOrgOrAdmin = requireRole([USER_ROLES.ORG, USER_ROLES.ADMIN]);
export const requireUserOrAdmin = requireRole([USER_ROLES.USER, USER_ROLES.ADMIN]);
export const requireAnyRole = requireRole([USER_ROLES.USER, USER_ROLES.ORG, USER_ROLES.ADMIN]);

export const checkOwnership = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params;
  
  if (!req.user) {
    res.status(401).json(
      createApiResponse(false, 'Authentication required')
    );
    return;
  }

  # Admin can access any resource
  if (req.user.role === USER_ROLES.ADMIN) {
    next();
    return;
  }

  # Check if user is accessing their own resource
  if (req.user.id === id) {
    next();
    return;
  }

  res.status(403).json(
    createApiResponse(false, 'Access denied - you can only access your own resources')
  );
};
EOF

# 7. src/middleware/validation.middleware.ts
cat << 'EOF' > src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createApiResponse } from '@/utils/helpers';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      res.status(400).json(
        createApiResponse(false, 'Validation error', null, errorMessage)
      );
      return;
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      res.status(400).json(
        createApiResponse(false, 'Query validation error', null, errorMessage)
      );
      return;
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      res.status(400).json(
        createApiResponse(false, 'Parameter validation error', null, errorMessage)
      );
      return;
    }

    req.params = value;
    next();
  };
};

export const validateFile = (options: {
  required?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;
    
    if (options.required && !file) {
      res.status(400).json(
        createApiResponse(false, 'File is required')
      );
      return;
    }

    if (file) {
      if (options.maxSize && file.size > options.maxSize) {
        res.status(400).json(
          createApiResponse(false, `File size must be less than ${options.maxSize} bytes`)
        );
        return;
      }

      if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
        res.status(400).json(
          createApiResponse(false, `File type must be one of: ${options.allowedTypes.join(', ')}`)
        );
        return;
      }
    }

    next();
  };
};
EOF

# 7. src/middleware/error.middleware.ts
cat << 'EOF' > src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError, createApiResponse } from '@/utils/helpers';
import { logger } from '@/utils/logger';

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let err = error;

  # Log error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  # Mongoose/Database errors
  if (error.name === 'CastError') {
    const message = 'Invalid resource ID';
    err = new AppError(message, 400);
  }

  # Duplicate key error
  if (error.name === 'MongoError' && (error as any).code === 11000) {
    const message = 'Duplicate field value entered';
    err = new AppError(message, 400);
  }

  # Joi validation error
  if (error.name === 'ValidationError') {
    const message = Object.values((error as any).errors).map((val: any) => val.message);
    err = new AppError(message.join(', '), 400);
  }

  # JWT errors
  if (error.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    err = new AppError(message, 401);
  }

  if (error.name === 'TokenExpiredError') {
    const message = 'Token expired';
    err = new AppError(message, 401);
  }

  # PostgreSQL/Drizzle errors
  if (error.message?.includes('duplicate key value')) {
    const message = 'Duplicate entry - resource already exists';
    err = new AppError(message, 409);
  }

  if (error.message?.includes('foreign key constraint')) {
    const message = 'Referenced resource does not exist';
    err = new AppError(message, 400);
  }

  if (error.message?.includes('not found')) {
    const message = 'Resource not found';
    err = new AppError(message, 404);
  }

  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json(
    createApiResponse(
      false,
      message,
      null,
      process.env.NODE_ENV === 'development' ? error.stack : undefined
    )
  );
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
EOF

# 8. src/services/auth.service.ts
cat << 'EOF' > src/services/auth.service.ts
import { db } from '@/config/database';
import { users } from '@/models/schema';
import { eq } from 'drizzle-orm';
import {
  hashPassword,
  comparePassword,
  generateToken,
  sanitizeUser,
  createError
} from '@/utils/helpers';
import { User, NewUser } from '@/models/schema';
import { USER_ROLES, USER_STATUS } from '@/utils/constants';
import { AuditService } from './audit.service';
import { logger } from '@/utils/logger';

export class AuthService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }, ipAddress?: string, userAgent?: string): Promise<{ user: User; token: string }> {
    try {
      # Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw createError('User already exists with this email', 409);
      }

      # Hash password
      const hashedPassword = await hashPassword(userData.password);

      # Create user
      const newUserData: NewUser = {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || USER_ROLES.USER,
        status: USER_STATUS.ACTIVE,
        walletBalance: '0',
        emailVerified: false
      };

      const [newUser] = await db
        .insert(users)
        .values(newUserData)
        .returning();

      # Generate token
      const token = generateToken({ 
        userId: newUser.id, 
        role: newUser.role,
        email: newUser.email 
      });

      # Log audit
      await this.auditService.log({
        userId: newUser.id,
        action: 'register',
        resource: 'user',
        resourceId: newUser.id,
        newValues: sanitizeUser(newUser),
        ipAddress,
        userAgent
      });

      logger.info(`New user registered: ${newUser.email} (${newUser.role})`);

      return {
        user: sanitizeUser(newUser) as User,
        token
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(
    email: string, 
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: User; token: string }> {
    try {
      # Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        throw createError('Invalid credentials', 401);
      }

      # Check password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw createError('Invalid credentials', 401);
      }

      # Check user status
      if (user.status !== USER_STATUS.ACTIVE) {
        throw createError(`Account is ${user.status}`, 403);
      }

      # Update last login
      await db
        .update(users)
        .set({ 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      # Generate token
      const token = generateToken({ 
        userId: user.id, 
        role: user.role,
        email: user.email 
      });

      # Log audit
      await this.auditService.log({
        userId: user.id,
        action: 'login',
        resource: 'user',
        resourceId: user.id,
        metadata: { loginTime: new Date() },
        ipAddress,
        userAgent
      });

      logger.info(`User logged in: ${user.email} (${user.role})`);

      return {
        user: sanitizeUser(user) as User,
        token
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user ? sanitizeUser(user) as User : null;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return user ? sanitizeUser(user) as User : null;
    } catch (error) {
      logger.error('Get user by email error:', error);
      throw error;
    }
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      # Get user with password
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw createError('User not found', 404);
      }

      # Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw createError('Current password is incorrect', 400);
      }

      # Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      # Update password
      await db
        .update(users)
        .set({ 
          password: hashedNewPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      # Log audit
      await this.auditService.log({
        userId,
        action: 'update_password',
        resource: 'user',
        resourceId: userId,
        metadata: { passwordChanged: true },
        ipAddress,
        userAgent
      });

      logger.info(`Password updated for user: ${user.email}`);
    } catch (error) {
      logger.error('Update password error:', error);
      throw error;
    }
  }

  async verifyEmail(userId: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          emailVerified: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      # Log audit
      await this.auditService.log({
        userId,
        action: 'verify_email',
        resource: 'user',
        resourceId: userId,
        newValues: { emailVerified: true }
      });

      logger.info(`Email verified for user: ${userId}`);
    } catch (error) {
      logger.error('Verify email error:', error);
      throw error;
    }
  }

  async logout(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      # Log audit
      await this.auditService.log({
        userId,
        action: 'logout',
        resource: 'user',
        resourceId: userId,
        metadata: { logoutTime: new Date() },
        ipAddress,
        userAgent
      });

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }
}
EOF

# 9. src/services/user.service.ts
cat << 'EOF' > src/services/user.service.ts
import { db } from '@/config/database';
import { users } from '@/models/schema';
import { eq } from 'drizzle-orm';
import { User, NewUser } from '@/models/schema';
import { sanitizeUser, createError } from '@/utils/helpers';
import { USER_STATUS } from '@/utils/constants';
import { AuditService } from './audit.service';
import { logger } from '@/utils/logger';

export class UserService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async updateProfile(
    userId: string,
    updateData: Partial<User>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User> {
    try {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!existingUser) {
        throw createError('User not found', 404);
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      # Log audit
      await this.auditService.log({
        userId,
        action: 'update',
        resource: 'user',
        resourceId: userId,
        oldValues: sanitizeUser(existingUser),
        newValues: sanitizeUser(updatedUser),
        ipAddress,
        userAgent
      });

      logger.info(`User profile updated: ${userId}`);
      return sanitizeUser(updatedUser) as User;
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  async updateWalletBalance(
    userId: string,
    amount: string,
    operation: 'add' | 'subtract' = 'add'
  ): Promise<User> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw createError('User not found', 404);
      }

      const currentBalance = parseFloat(user.walletBalance);
      const changeAmount = parseFloat(amount);
      
      let newBalance: number;
      if (operation === 'add') {
        newBalance = currentBalance + changeAmount;
      } else {
        newBalance = currentBalance - changeAmount;
        if (newBalance < 0) {
          throw createError('Insufficient wallet balance', 400);
        }
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          walletBalance: newBalance.toString(),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      logger.info(`Wallet balance updated for user ${userId}: ${currentBalance} -> ${newBalance}`);
      return sanitizeUser(updatedUser) as User;
    } catch (error) {
      logger.error('Update wallet balance error:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return user ? sanitizeUser(user) as User : null;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  async suspendUser(
    userId: string,
    adminId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw createError('User not found', 404);
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          status: USER_STATUS.SUSPENDED,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      # Log audit
      await this.auditService.log({
        userId: adminId,
        action: 'suspend',
        resource: 'user',
        resourceId: userId,
        oldValues: { status: user.status },
        newValues: { status: USER_STATUS.SUSPENDED },
        metadata: { reason },
        ipAddress,
        userAgent
      });

      logger.info(`User suspended: ${userId} by admin: ${adminId}`);
      return sanitizeUser(updatedUser) as User;
    } catch (error) {
      logger.error('Suspend user error:', error);
      throw error;
    }
  }

  async reactivateUser(
    userId: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw createError('User not found', 404);
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          status: USER_STATUS.ACTIVE,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      # Log audit
      await this.auditService.log({
        userId: adminId,
        action: 'activate',
        resource: 'user',
        resourceId: userId,
        oldValues: { status: user.status },
        newValues: { status: USER_STATUS.ACTIVE },
        ipAddress,
        userAgent
      });

      logger.info(`User reactivated: ${userId} by admin: ${adminId}`);
      return sanitizeUser(updatedUser) as User;
    } catch (error) {
      logger.error('Reactivate user error:', error);
      throw error;
    }
  }
}
EOF

# 9. src/services/service.service.ts
cat << 'EOF' > src/services/service.service.ts
import { db } from '@/config/database';
import { services, users, serviceReviews } from '@/models/schema';
import { eq, and, desc, asc, ilike, gte, lte, sql } from 'drizzle-orm';
import { Service, NewService, ServiceReview, NewServiceReview } from '@/models/schema';
import { createError, calculatePagination } from '@/utils/helpers';
import { SERVICE_STATUS } from '@/utils/constants';
import { ServiceFilters, PaginationParams, PaginatedResponse } from '@/types';
import { AuditService } from './audit.service';
import { logger } from '@/utils/logger';

export class ServiceService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  async createService(
    serviceData: NewService,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Service> {
    try {
      const [newService] = await db
        .insert(services)
        .values({
          ...serviceData,
          organizationId: userId,
          status: SERVICE_STATUS.PENDING
        })
        .returning();

      # Log audit
      await this.auditService.log({
        userId,
        action: 'create',
        resource: 'service',
        resourceId: newService.id,
        newValues: newService,
        ipAddress,
        userAgent
      });

      logger.info(`New service created: ${newService.id} by org: ${userId}`);
      return newService;
    } catch (error) {
      logger.error('Create service error:', error);
      throw error;
    }
  }

  async getServices(
    filters: ServiceFilters = {},
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Service>> {
    try {
      let query = db.select().from(services);
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(services);

      # Apply filters
      const conditions = [];

      if (filters.category) {
        conditions.push(eq(services.category, filters.category));
      }

      if (filters.status) {
        conditions.push(eq(services.status, filters.status));
      }

      if (filters.organizationId) {
        conditions.push(eq(services.organizationId, filters.organizationId));
      }

      if (filters.search) {
        conditions.push(
          ilike(services.title, `%${filters.search}%`)
        );
      }

      if (filters.minPrice) {
        conditions.push(gte(services.price, filters.minPrice.toString()));
      }

      if (filters.maxPrice) {
        conditions.push(lte(services.price, filters.maxPrice.toString()));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
        countQuery = countQuery.where(and(...conditions));
      }

      # Get total count
      const [{ count: total }] = await countQuery;

      # Apply pagination and sorting
      const offset = (pagination.page - 1) * pagination.limit;
      const orderColumn = pagination.sortBy === 'price' ? services.price :
                         pagination.sortBy === 'rating' ? services.rating :
                         services.createdAt;
      
      const orderDirection = pagination.sortOrder === 'desc' ? desc : asc;
      
      const data = await query
        .orderBy(orderDirection(orderColumn))
        .limit(pagination.limit)
        .offset(offset);

      return {
        data,
        pagination: calculatePagination(pagination.page, pagination.limit, total)
      };
    } catch (error) {
      logger.error('Get services error:', error);
      throw error;
    }
  }

  async getServiceById(id: string): Promise<Service | null> {
    try {
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1);

      return service || null;
    } catch (error) {
      logger.error('Get service by ID error:', error);
      throw error;
    }
  }

  async updateService(
    id: string,
    updateData: Partial<Service>,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Service> {
    try {
      const [existingService] = await db
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1);

      if (!existingService) {
        throw createError('Service not found', 404);
      }

      const [updatedService] = await db
        .update(services)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(services.id, id))
        .returning();

      # Log audit
      await this.auditService.log({
        userId,
        action: 'update',
        resource: 'service',
        resourceId: id,
        oldValues: existingService,
        newValues: updatedService,
        ipAddress,
        userAgent
      });

      logger.info(`Service updated: ${id} by user: ${userId}`);
      return updatedService;
    } catch (error) {
      logger.error('Update service error:', error);
      throw error;
    }
  }

  async deleteService(
    id: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const [existingService] = await db
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1);

      if (!existingService) {
        throw createError('Service not found', 404);
      }

      await db.delete(services).where(eq(services.id, id));

      # Log audit
      await this.auditService.log({
        userId,
        action: 'delete',
        resource: 'service',
        resourceId: id,
        oldValues: existingService,
        ipAddress,
        userAgent
      });

      logger.info(`Service deleted: ${id} by user: ${userId}`);
    } catch (error) {
      logger.error('Delete service error:', error);
      throw error;
    }
  }

  async approveService(
    id: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Service> {
    try {
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1);

      if (!service) {
        throw createError('Service not found', 404);
      }

      const [updatedService] = await db
        .update(services)
        .set({
          status: SERVICE_STATUS.ACTIVE,
          updatedAt: new Date()
        })
        .where(eq(services.id, id))
        .returning();

      # Log audit
      await this.auditService.log({
        userId: adminId,
        action: 'approve',
        resource: 'service',
        resourceId: id,
        oldValues: { status: service.status },
        newValues: { status: SERVICE_STATUS.ACTIVE },
        ipAddress,
        userAgent
      });

      logger.info(`Service approved: ${id} by admin: ${adminId}`);
      return updatedService;
    } catch (error) {
      logger.error('Approve service error:', error);
      throw error;
    }
  }

  async addReview(
    serviceId: string,
    userId: string,
    rating: number,
    review?: string
  ): Promise<ServiceReview> {
    try {
      # Check if service exists
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, serviceId))
        .limit(1);

      if (!service) {
        throw createError('Service not found', 404);
      }

      # Check if user already reviewed this service
      const [existingReview] = await db
        .select()
        .from(serviceReviews)
        .where(and(
          eq(serviceReviews.serviceId, serviceId),
          eq(serviceReviews.userId, userId)
        ))
        .limit(1);

      if (existingReview) {
        throw createError('You have already reviewed this service', 409);
      }

      # Create review
      const [newReview] = await db
        .insert(serviceReviews)
        .values({
          serviceId,
          userId,
          rating,
          review
        })
        .returning();

      # Update service rating
      await this.updateServiceRating(serviceId);

      logger.info(`Review added for service: ${serviceId} by user: ${userId}`);
      return newReview;
    } catch (error) {
      logger.error('Add review error:', error);
      throw error;
    }
  }

  private async updateServiceRating(serviceId: string): Promise<void> {
    try {
      const reviews = await db
        .select()
        .from(serviceReviews)
        .where(and(
          eq(serviceReviews.serviceId, serviceId),
          eq(serviceReviews.isVisible, true)
        ));

      if (reviews.length === 0) return;

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      await db
        .update(services)
        .set({
          rating: averageRating.toFixed(2),
          reviewCount: reviews.length,
          updatedAt: new Date()
        })
        .where(eq(services.id, serviceId));
    } catch (error) {
      logger.error('Update service rating error:', error);
    }
  }

  async incrementBookings(serviceId: string): Promise<void> {
    try {
      await db
        .update(services)
        .set({
          bookings: sql`${services.bookings} + 1`,
          updatedAt: new Date()
        })
        .where(eq(services.id, serviceId));
    } catch (error) {
      logger.error('Increment bookings error:', error);
      throw error;
    }
  }
}
EOF

# 9. src/services/payment.service.ts
cat << 'EOF' > src/services/payment.service.ts
import { db } from '@/config/database';
import { paymentTransactions, transactions, users } from '@/models/schema';
import { eq } from 'drizzle-orm';
import { PaymentTransaction, NewPaymentTransaction } from '@/models/schema';
import { razorpay, razorpayConfig } from '@/config/razorpay';
import { createError, generateOrderId } from '@/utils/helpers';
import { PAYMENT_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS } from '@/utils/constants';
import { PaymentOrderData, PaymentVerificationData } from '@/types';
import { TransactionService } from './transaction.service';
import { UserService } from './user.service';
import { AuditService } from './audit.service';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

export class PaymentService {
  private transactionService: TransactionService;
  private userService: UserService;
  private auditService: AuditService;

  constructor() {
    this.transactionService = new TransactionService();
    this.userService = new UserService();
    this.auditService = new AuditService();
  }

  async createPaymentOrder(
    userId: string,
    amount: number,
    purpose: string = 'coin_purchase'
  ): Promise<PaymentOrderData> {
    try {
      # Validate amount
      if (amount < razorpayConfig.minAmount || amount > razorpayConfig.maxAmount) {
        throw createError(
          `Amount must be between ${razorpayConfig.minAmount} and ${razorpayConfig.maxAmount}`,
          400
        );
      }

      # Create Razorpay order
      const receipt = generateOrderId();
      const razorpayOrder = await razorpay.orders.create({
        amount: amount * 100, # Razorpay expects amount in paise
        currency: razorpayConfig.currency,
        receipt,
        notes: {
          userId,
          purpose
        }
      });

      # Create payment transaction record
      const paymentTransaction: NewPaymentTransaction = {
        userId,
        razorpayOrderId: razorpayOrder.id,
        amount: amount.toString(),
        currency: razorpayConfig.currency,
        status: PAYMENT_STATUS.PENDING,
        paymentMethod: 'online',
        gateway: 'razorpay',
        metadata: {
          purpose,
          receipt
        }
      };

      const [newPaymentTransaction] = await db
        .insert(paymentTransactions)
        .values(paymentTransaction)
        .returning();

      logger.info(`Payment order created: ${razorpayOrder.id} for user: ${userId}`);

      return {
        orderId: razorpayOrder.id,
        amount,
        currency: razorpayConfig.currency,
        receipt,
        paymentTransactionId: newPaymentTransaction.id,
        keyId: razorpayConfig.keyId
      };
    } catch (error) {
      logger.error('Create payment order error:', error);
      throw error;
    }
  }

  async verifyPayment(
    verificationData: PaymentVerificationData,
    userId: string
  ): Promise<PaymentTransaction> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verificationData;

      # Verify signature
      const isSignatureValid = this.verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isSignatureValid) {
        throw createError('Invalid payment signature', 400);
      }

      # Get payment transaction
      const [paymentTransaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.razorpayOrderId, razorpay_order_id))
        .limit(1);

      if (!paymentTransaction) {
        throw createError('Payment transaction not found', 404);
      }

      if (paymentTransaction.userId !== userId) {
        throw createError('Unauthorized payment verification', 403);
      }

      # Update payment transaction
      const [updatedPaymentTransaction] = await db
        .update(paymentTransactions)
        .set({
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: PAYMENT_STATUS.COMPLETED,
          updatedAt: new Date()
        })
        .where(eq(paymentTransactions.id, paymentTransaction.id))
        .returning();

      # Create transaction record
      const amount = parseFloat(paymentTransaction.amount);
      await this.transactionService.createTransaction({
        userId,
        type: TRANSACTION_TYPES.COIN_PURCHASE,
        amount: amount.toString(),
        status: TRANSACTION_STATUS.COMPLETED,
        description: `Coin purchase via payment: ${razorpay_payment_id}`,
        paymentId: razorpay_payment_id,
        paymentMethod: 'razorpay',
        metadata: {
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id
        }
      });

      # Update user wallet balance
      await this.userService.updateWalletBalance(userId, amount.toString(), 'add');

      # Log audit
      await this.auditService.log({
        userId,
        action: 'payment_completed',
        resource: 'payment',
        resourceId: paymentTransaction.id,
        newValues: { status: PAYMENT_STATUS.COMPLETED, amount },
        metadata: { paymentId: razorpay_payment_id }
      });

      logger.info(`Payment verified successfully: ${razorpay_payment_id} for user: ${userId}`);
      return updatedPaymentTransaction;
    } catch (error) {
      logger.error('Verify payment error:', error);
      throw error;
    }
  }

  async handlePaymentFailure(
    orderId: string,
    reason: string
  ): Promise<void> {
    try {
      const [paymentTransaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.razorpayOrderId, orderId))
        .limit(1);

      if (!paymentTransaction) {
        throw createError('Payment transaction not found', 404);
      }

      await db
        .update(paymentTransactions)
        .set({
          status: PAYMENT_STATUS.FAILED,
          failureReason: reason,
          updatedAt: new Date()
        })
        .where(eq(paymentTransactions.id, paymentTransaction.id));

      # Log audit
      await this.auditService.log({
        userId: paymentTransaction.userId,
        action: 'payment_failed',
        resource: 'payment',
        resourceId: paymentTransaction.id,
        newValues: { status: PAYMENT_STATUS.FAILED, reason }
      });

      logger.warn(`Payment failed: ${orderId} - ${reason}`);
    } catch (error) {
      logger.error('Handle payment failure error:', error);
      throw error;
    }
  }

  private verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', razorpayConfig.keySecret)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      logger.error('Signature verification error:', error);
      return false;
    }
  }

  async processRefund(
    paymentId: string,
    amount?: number,
    adminId?: string
  ): Promise<PaymentTransaction> {
    try {
      const [paymentTransaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.razorpayPaymentId, paymentId))
        .limit(1);

      if (!paymentTransaction) {
        throw createError('Payment transaction not found', 404);
      }

      const refundAmount = amount || parseFloat(paymentTransaction.amount);
      
      # Create refund with Razorpay
      const refund = await razorpay.payments.refund(paymentId, {
        amount: refundAmount * 100, # Convert to paise
        notes: {
          reason: 'Customer requested refund',
          processedBy: adminId || 'system'
        }
      });

      # Update payment transaction
      const [updatedTransaction] = await db
        .update(paymentTransactions)
        .set({
          refundId: refund.id,
          refundAmount: refundAmount.toString(),
          refundStatus: 'processed',
          updatedAt: new Date()
        })
        .where(eq(paymentTransactions.id, paymentTransaction.id))
        .returning();

      # Deduct amount from user wallet
      await this.userService.updateWalletBalance(
        paymentTransaction.userId,
        refundAmount.toString(),
        'subtract'
      );

      # Create refund transaction record
      await this.transactionService.createTransaction({
        userId: paymentTransaction.userId,
        type: TRANSACTION_TYPES.REFUND,
        amount: refundAmount.toString(),
        status: TRANSACTION_STATUS.COMPLETED,
        description: `Refund for payment: ${paymentId}`,
        paymentId: refund.id,
        paymentMethod: 'razorpay_refund',
        metadata: {
          originalPaymentId: paymentId,
          refundId: refund.id
        }
      });

      logger.info(`Refund processed: ${refund.id} for payment: ${paymentId}`);
      return updatedTransaction;
    } catch (error) {
      logger.error('Process refund error:', error);
      throw error;
    }
  }
}
EOF

# 9. src/services/conversion.service.ts
cat << 'EOF' > src/services/conversion.service.ts
import { db } from '@/config/database';
import { conversionRequests } from '@/models/schema';
import { eq, desc, and } from 'drizzle-orm';
import { ConversionRequest, NewConversionRequest } from '@/models/schema';
import { createError, calculatePagination } from '@/utils/helpers';
import { CONVERSION_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS } from '@/utils/constants';
import { PaginationParams, PaginatedResponse } from '@/types';
import { TransactionService } from './transaction.service';
import { UserService } from './user.service';
import { AuditService } from './audit.service';
import { logger } from '@/utils/logger';

export class ConversionService {
  private transactionService: TransactionService;
  private userService: UserService;
  private auditService: AuditService;

  constructor() {
    this.transactionService = new TransactionService();
    this.userService = new UserService();
    this.auditService = new AuditService();
  }

  async createConversionRequest(
    organizationId: string,
    amount: number,
    bankDetails: any
  ): Promise<ConversionRequest> {
    try {
      # Check if organization has sufficient balance
      const user = await this.userService.getUserById(organizationId);
      if (!user) {
        throw createError('Organization not found', 404);
      }

      const currentBalance = parseFloat(user.walletBalance);
      if (currentBalance < amount) {
        throw createError('Insufficient wallet balance', 400);
      }

      # Create conversion request
      const conversionData: NewConversionRequest = {
        organizationId,
        amount: amount.toString(),
        currency: 'INR',
        status: CONVERSION_STATUS.PENDING,
        bankDetails
      };

      const [newRequest] = await db
        .insert(conversionRequests)
        .values(conversionData)
        .returning();

      # Log audit
      await this.auditService.log({
        userId: organizationId,
        action: 'create',
        resource: 'conversion',
        resourceId: newRequest.id,
        newValues: newRequest
      });

      logger.info(`Conversion request created: ${newRequest.id} by org: ${organizationId}`);
      return newRequest;
    } catch (error) {
      logger.error('Create conversion request error:', error);
      throw error;
    }
  }

  async getConversionRequests(
    pagination: PaginationParams,
    organizationId?: string
  ): Promise<PaginatedResponse<ConversionRequest>> {
    try {
      let query = db.select().from(conversionRequests);
      
      if (organizationId) {
        query = query.where(eq(conversionRequests.organizationId, organizationId));
      }

      # Get total count
      const totalQuery = organizationId 
        ? db.select().from(conversionRequests).where(eq(conversionRequests.organizationId, organizationId))
        : db.select().from(conversionRequests);
      
      const total = (await totalQuery).length;

      # Apply pagination
      const offset = (pagination.page - 1) * pagination.limit;
      const data = await query
        .orderBy(desc(conversionRequests.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      return {
        data,
        pagination: calculatePagination(pagination.page, pagination.limit, total)
      };
    } catch (error) {
      logger.error('Get conversion requests error:', error);
      throw error;
    }
  }

  async approveConversionRequest(
    requestId: string,
    adminId: string,
    transactionId?: string
  ): Promise<ConversionRequest> {
    try {
      const [request] = await db
        .select()
        .from(conversionRequests)
        .where(eq(conversionRequests.id, requestId))
        .limit(1);

      if (!request) {
        throw createError('Conversion request not found', 404);
      }

      if (request.status !== CONVERSION_STATUS.PENDING) {
        throw createError('Conversion request is not pending', 400);
      }

      # Update request status
      const [updatedRequest] = await db
        .update(conversionRequests)
        .set({
          status: CONVERSION_STATUS.APPROVED,
          processedBy: adminId,
          processedAt: new Date(),
          transactionId,
          updatedAt: new Date()
        })
        .where(eq(conversionRequests.id, requestId))
        .returning();

      # Deduct amount from organization wallet
      const amount = parseFloat(request.amount);
      await this.userService.updateWalletBalance(
        request.organizationId,
        amount.toString(),
        'subtract'
      );

      # Create transaction record
      await this.transactionService.createTransaction({
        userId: request.organizationId,
        type: TRANSACTION_TYPES.COIN_CONVERSION,
        amount: amount.toString(),
        status: TRANSACTION_STATUS.COMPLETED,
        description: `Coin conversion to bank account`,
        metadata: {
          conversionRequestId: requestId,
          bankDetails: request.bankDetails,
          transactionId
        }
      });

      # Log audit
      await this.auditService.log({
        userId: adminId,
        action: 'approve',
        resource: 'conversion',
        resourceId: requestId,
        oldValues: { status: request.status },
        newValues: { status: CONVERSION_STATUS.APPROVED },
        metadata: { amount, transactionId }
      });

      logger.info(`Conversion request approved: ${requestId} by admin: ${adminId}`);
      return updatedRequest;
    } catch (error) {
      logger.error('Approve conversion request error:', error);
      throw error;
    }
  }

  async rejectConversionRequest(
    requestId: string,
    adminId: string,
    reason: string
  ): Promise<ConversionRequest> {
    try {
      const [request] = await db
        .select()
        .from(conversionRequests)
        .where(eq(conversionRequests.id, requestId))
        .limit(1);

      if (!request) {
        throw createError('Conversion request not found', 404);
      }

      if (request.status !== CONVERSION_STATUS.PENDING) {
        throw createError('Conversion request is not pending', 400);
      }

      # Update request status
      const [updatedRequest] = await db
        .update(conversionRequests)
        .set({
          status: CONVERSION_STATUS.REJECTED,
          processedBy: adminId,
          processedAt: new Date(),
          reason,
          updatedAt: new Date()
        })
        .where(eq(conversionRequests.id, requestId))
        .returning();

      # Log audit
      await this.auditService.log({
        userId: adminId,
        action: 'reject',
        resource: 'conversion',
        resourceId: requestId,
        oldValues: { status: request.status },
        newValues: { status: CONVERSION_STATUS.REJECTED },
        metadata: { reason }
      });

      logger.info(`Conversion request rejected: ${requestId} by admin: ${adminId}`);
      return updatedRequest;
    } catch (error) {
      logger.error('Reject conversion request error:', error);
      throw error;
    }
  }

  async getConversionRequestById(id: string): Promise<ConversionRequest | null> {
    try {
      const [request] = await db
        .select()
        .from(conversionRequests)
        .where(eq(conversionRequests.id, id))
        .limit(1);

      return request || null;
    } catch (error) {
      logger.error('Get conversion request by ID error:', error);
      throw error;
    }
  }
}
EOF

# 9. src/services/transaction.service.ts
cat << 'EOF' > src/services/transaction.service.ts
import { db } from '@/config/database';
import { transactions } from '@/models/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { Transaction, NewTransaction } from '@/models/schema';
import { createError, calculatePagination } from '@/utils/helpers';
import { TransactionFilters, PaginationParams, PaginatedResponse } from '@/types';
import { UserService } from './user.service';
import { logger } from '@/utils/logger';

export class TransactionService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async createTransaction(transactionData: NewTransaction): Promise<Transaction> {
    try {
      # Get user's current balance
      const user = await this.userService.getUserById(transactionData.userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      const currentBalance = parseFloat(user.walletBalance);
      const transactionAmount = parseFloat(transactionData.amount);

      # Calculate new balance based on transaction type
      let newBalance = currentBalance;
      if (transactionData.type === 'coin_purchase') {
        newBalance += transactionAmount;
      } else if (transactionData.type === 'service_booking' || transactionData.type === 'coin_conversion') {
        newBalance -= transactionAmount;
      } else if (transactionData.type === 'refund') {
        newBalance += transactionAmount;
      }

      # Create transaction with balance information
      const [newTransaction] = await db
        .insert(transactions)
        .values({
          ...transactionData,
          balanceBefore: currentBalance.toString(),
          balanceAfter: newBalance.toString()
        })
        .returning();

      logger.info(`Transaction created: ${newTransaction.id} for user: ${transactionData.userId}`);
      return newTransaction;
    } catch (error) {
      logger.error('Create transaction error:', error);
      throw error;
    }
  }

  async getTransactions(
    filters: TransactionFilters = {},
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      let query = db.select().from(transactions);
      let countQuery = db.select({ count: sql<number>`count(*)` }).from(transactions);

      # Apply filters
      const conditions = [];

      if (filters.userId) {
        conditions.push(eq(transactions.userId, filters.userId));
      }

      if (filters.serviceId) {
        conditions.push(eq(transactions.serviceId, filters.serviceId));
      }

      if (filters.type) {
        conditions.push(eq(transactions.type, filters.type));
      }

      if (filters.status) {
        conditions.push(eq(transactions.status, filters.status));
      }

      if (filters.startDate) {
        conditions.push(gte(transactions.createdAt, new Date(filters.startDate)));
      }

      if (filters.endDate) {
        conditions.push(lte(transactions.createdAt, new Date(filters.endDate)));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
        countQuery = countQuery.where(and(...conditions));
      }

      # Get total count
      const [{ count: total }] = await countQuery;

      # Apply pagination
      const offset = (pagination.page - 1) * pagination.limit;
      const data = await query
        .orderBy(desc(transactions.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      return {
        data,
        pagination: calculatePagination(pagination.page, pagination.limit, total)
      };
    } catch (error) {
      logger.error('Get transactions error:', error);
      throw error;
    }
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1);

      return transaction || null;
    } catch (error) {
      logger.error('Get transaction by ID error:', error);
      throw error;
    }
  }

  async updateTransactionStatus(
    id: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<Transaction> {
    try {
      const [updatedTransaction] = await db
        .update(transactions)
        .set({
          status,
          metadata,
          updatedAt: new Date()
        })
        .where(eq(transactions.id, id))
        .returning();

      if (!updatedTransaction) {
        throw createError('Transaction not found', 404);
      }

      logger.info(`Transaction status updated: ${id} -> ${status}`);
      return updatedTransaction;
    } catch (error) {
      logger.error('Update transaction status error:', error);
      throw error;
    }
  }

  async getUserTransactionHistory(
    userId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      return this.getTransactions({ userId }, pagination);
    } catch (error) {
      logger.error('Get user transaction history error:', error);
      throw error;
    }
  }

  async getTransactionStats(userId?: string): Promise<any> {
    try {
      let query = db.select().from(transactions);
      
      if (userId) {
        query = query.where(eq(transactions.userId, userId));
      }

      const allTransactions = await query;

      const stats = {
        total: allTransactions.length,
        completed: allTransactions.filter(t => t.status === 'completed').length,
        pending: allTransactions.filter(t => t.status === 'pending').length,
        failed: allTransactions.filter(t => t.status === 'failed').length,
        totalAmount: allTransactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        byType: {
          coin_purchase: allTransactions.filter(t => t.type === 'coin_purchase').length,
          service_booking: allTransactions.filter(t => t.type === 'service_booking').length,
          coin_conversion: allTransactions.filter(t => t.type === 'coin_conversion').length,
          refund: allTransactions.filter(t => t.type === 'refund').length
        }
      };

      return stats;
    } catch (error) {
      logger.error('Get transaction stats error:', error);
      throw error;
    }
  }
}
EOF

# 9. src/services/admin.service.ts
cat << 'EOF' > src/services/admin.service.ts
import { db } from '@/config/database';
import { users, services, transactions, conversionRequests } from '@/models/schema';
import { eq, count, desc, gte, sql } from 'drizzle-orm';
import { DashboardStats, UserStats, ServiceStats, FinancialStats } from '@/types';
import { USER_ROLES, SERVICE_STATUS, TRANSACTION_STATUS } from '@/utils/constants';
import { logger } from '@/utils/logger';

export class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const thisMonth = new Date();
      thisMonth.setDate(1);

      # User stats
      const totalUsers = await db.select({ count: count() }).from(users);
      const activeUsers = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.status, 'active'));
      
      const newUsersThisMonth = await db
        .select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, thisMonth));
      
      const totalOrganizations = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, USER_ROLES.ORG));

      const userStats: UserStats = {
        totalUsers: totalUsers[0].count,
        activeUsers: activeUsers[0].count,
        newUsersThisMonth: newUsersThisMonth[0].count,
        totalOrganizations: totalOrganizations[0].count
      };

      # Service stats
      const totalServices = await db.select({ count: count() }).from(services);
      const activeServices = await db
        .select({ count: count() })
        .from(services)
        .where(eq(services.status, SERVICE_STATUS.ACTIVE));
      
      const pendingServices = await db
        .select({ count: count() })
        .from(services)
        .where(eq(services.status, SERVICE_STATUS.PENDING));

      const totalBookingsResult = await db
        .select({ total: sql<number>`sum(${services.bookings})` })
        .from(services);

      const serviceStats: ServiceStats = {
        totalServices: totalServices[0].count,
        activeServices: activeServices[0].count,
        pendingServices: pendingServices[0].count,
        totalBookings: totalBookingsResult[0].total || 0
      };

      # Financial stats
      const allUsers = await db.select().from(users);
      const totalCoinsInCirculation = allUsers.reduce(
        (sum, user) => sum + parseFloat(user.walletBalance), 
        0
      );

      const completedTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.status, TRANSACTION_STATUS.COMPLETED));

      const totalRevenue = completedTransactions
        .filter(t => t.type === 'coin_purchase')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const thisMonthRevenue = completedTransactions
        .filter(t => t.type === 'coin_purchase' && t.createdAt >= thisMonth)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const pendingConversions = await db
        .select({ count: count() })
        .from(conversionRequests)
        .where(eq(conversionRequests.status, 'pending'));

      const financialStats: FinancialStats = {
        totalCoinsInCirculation,
        totalRevenue,
        pendingConversions: pendingConversions[0].count,
        thisMonthRevenue
      };

      return {
        users: userStats,
        services: serviceStats,
        financial: financialStats
      };
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      throw error;
    }
  }

  async getRecentActivity(limit: number = 10) {
    try {
      const recentTransactions = await db
        .select()
        .from(transactions)
        .orderBy(desc(transactions.createdAt))
        .limit(limit);

      const recentServices = await db
        .select()
        .from(services)
        .orderBy(desc(services.createdAt))
        .limit(limit);

      const recentUsers = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit);

      return {
        transactions: recentTransactions,
        services: recentServices,
        users: recentUsers.map(user => {
          const { password, ...safeUser } = user;
          return safeUser;
        })
      };
    } catch (error) {
      logger.error('Get recent activity error:', error);
      throw error;
    }
  }

  async getSystemHealth() {
    try {
      # Check database connectivity
      const dbCheck = await db.select({ count: count() }).from(users);
      const isDatabaseHealthy = dbCheck[0].count >= 0;

      # Calculate uptime (simplified)
      const uptime = process.uptime();

      # Memory usage
      const memoryUsage = process.memoryUsage();

      return {
        database: {
          status: isDatabaseHealthy ? 'healthy' : 'unhealthy',
          responseTime: '< 100ms' # This would be actual response time in real implementation
        },
        server: {
          uptime: Math.floor(uptime),
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
          }
        },
        external: {
          razorpay: 'healthy', # This would be actual health check
          supabase: 'healthy'
        }
      };
    } catch (error) {
      logger.error('Get system health error:', error);
      throw error;
    }
  }
}
EOF

# 9. src/services/audit.service.ts
cat << 'EOF' > src/services/audit.service.ts
import { db } from '@/config/database';
import { auditLogs } from '@/models/schema';
import { NewAuditLog, AuditLog } from '@/models/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { AuditLogData, PaginationParams, PaginatedResponse } from '@/types';
import { calculatePagination } from '@/utils/helpers';
import { logger } from '@/utils/logger';

export class AuditService {
  async log(data: AuditLogData): Promise<AuditLog> {
    try {
      const auditData: NewAuditLog = {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata
      };

      const [newAuditLog] = await db
        .insert(auditLogs)
        .values(auditData)
        .returning();

      return newAuditLog;
    } catch (error) {
      logger.error('Audit log error:', error);
      throw error;
    }
  }

  async getAuditLogs(
    filters: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: string;
      endDate?: string;
    } = {},
    pagination: PaginationParams
  ): Promise<PaginatedResponse<AuditLog>> {
    try {
      let query = db.select().from(auditLogs);

      # Apply filters
      const conditions = [];

      if (filters.userId) {
        conditions.push(eq(auditLogs.userId, filters.userId));
      }

      if (filters.action) {
        conditions.push(eq(auditLogs.action, filters.action));
      }

      if (filters.resource) {
        conditions.push(eq(auditLogs.resource, filters.resource));
      }

      if (filters.startDate) {
        conditions.push(gte(auditLogs.createdAt, new Date(filters.startDate)));
      }

      if (filters.endDate) {
        conditions.push(lte(auditLogs.createdAt, new Date(filters.endDate)));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      # Get total count
      const totalQuery = conditions.length > 0 
        ? db.select().from(auditLogs).where(and(...conditions))
        : db.select().from(auditLogs);
      
      const total = (await totalQuery).length;

      # Apply pagination
      const offset = (pagination.page - 1) * pagination.limit;
      const data = await query
        .orderBy(desc(auditLogs.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      return {
        data,
        pagination: calculatePagination(pagination.page, pagination.limit, total)
      };
    } catch (error) {
      logger.error('Get audit logs error:', error);
      throw error;
    }
  }

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    try {
      const [auditLog] = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.id, id))
        .limit(1);

      return auditLog || null;
    } catch (error) {
      logger.error('Get audit log by ID error:', error);
      throw error;
    }
  }

  async getActivitySummary(userId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const logs = await db
        .select()
        .from(auditLogs)
        .where(and(
          eq(auditLogs.userId, userId),
          gte(auditLogs.createdAt, startDate)
        ))
        .orderBy(desc(auditLogs.createdAt));

      const summary = {
        totalActions: logs.length,
        actionBreakdown: logs.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        resourceBreakdown: logs.reduce((acc, log) => {
          acc[log.resource] = (acc[log.resource] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentActivity: logs.slice(0, 10)
      };

      return summary;
    } catch (error) {
      logger.error('Get activity summary error:', error);
      throw error;
    }
  }
}
EOF

# 10. src/controllers/auth.controller.ts
cat << 'EOF' > src/controllers/auth.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { AuthService } from '@/services/auth.service';
import { createApiResponse, getClientIp, getUserAgent } from '@/utils/helpers';
import { asyncHandler } from '@/middleware/error.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { name, email, password, role } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const result = await this.authService.register(
      { name, email, password, role },
      ipAddress,
      userAgent
    );

    res.status(201).json(
      createApiResponse(true, 'User registered successfully', result)
    );
  });

  login = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const result = await this.authService.login(email, password, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'Login successful', result)
    );
  });

  getProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.json(
      createApiResponse(true, 'Profile retrieved successfully', req.user)
    );
  });

  updatePassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    await this.authService.updatePassword(
      req.user!.id,
      currentPassword,
      newPassword,
      ipAddress,
      userAgent
    );

    res.json(
      createApiResponse(true, 'Password updated successfully')
    );
  });

  verifyEmail = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    await this.authService.verifyEmail(req.user!.id);

    res.json(
      createApiResponse(true, 'Email verified successfully')
    );
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    await this.authService.logout(req.user!.id, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'Logout successful')
    );
  });
}
EOF

# 10. src/controllers/user.controller.ts
cat << 'EOF' > src/controllers/user.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { UserService } from '@/services/user.service';
import { createApiResponse, getClientIp, getUserAgent, validatePaginationParams } from '@/utils/helpers';
import { asyncHandler } from '@/middleware/error.middleware';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const updateData = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const updatedUser = await this.userService.updateProfile(
      req.user!.id,
      updateData,
      ipAddress,
      userAgent
    );

    res.json(
      createApiResponse(true, 'Profile updated successfully', updatedUser)
    );
  });

  getUserById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const user = await this.userService.getUserById(id);
    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    res.json(
      createApiResponse(true, 'User retrieved successfully', user)
    );
  });

  getWalletBalance = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.json(
      createApiResponse(true, 'Wallet balance retrieved successfully', {
        balance: req.user!.walletBalance,
        currency: 'INR'
      })
    );
  });
}
EOF

# 10. src/controllers/service.controller.ts
cat << 'EOF' > src/controllers/service.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { ServiceService } from '@/services/service.service';
import { createApiResponse, getClientIp, getUserAgent, validatePaginationParams } from '@/utils/helpers';
import { asyncHandler } from '@/middleware/error.middleware';

export class ServiceController {
  private serviceService: ServiceService;

  constructor() {
    this.serviceService = new ServiceService();
  }

  createService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const serviceData = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const newService = await this.serviceService.createService(
      serviceData,
      req.user!.id,
      ipAddress,
      userAgent
    );

    res.status(201).json(
      createApiResponse(true, 'Service created successfully', newService)
    );
  });

  getServices = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const pagination = validatePaginationParams(req.query.page, req.query.limit);
    const filters = {
      category: req.query.category as string,
      search: req.query.search as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      status: req.query.status as string,
      organizationId: req.query.organizationId as string
    };

    const result = await this.serviceService.getServices(filters, pagination);

    res.json(
      createApiResponse(true, 'Services retrieved successfully', result.data, undefined, result.pagination)
    );
  });

  getServiceById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const service = await this.serviceService.getServiceById(id);
    if (!service) {
      return res.status(404).json(
        createApiResponse(false, 'Service not found')
      );
    }

    res.json(
      createApiResponse(true, 'Service retrieved successfully', service)
    );
  });

  updateService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updateData = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const updatedService = await this.serviceService.updateService(
      id,
      updateData,
      req.user!.id,
      ipAddress,
      userAgent
    );

    res.json(
      createApiResponse(true, 'Service updated successfully', updatedService)
    );
  });

  deleteService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    await this.serviceService.deleteService(id, req.user!.id, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'Service deleted successfully')
    );
  });

  addReview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { rating, review } = req.body;

    const newReview = await this.serviceService.addReview(id, req.user!.id, rating, review);

    res.status(201).json(
      createApiResponse(true, 'Review added successfully', newReview)
    );
  });

  bookService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    # Get service details
    const service = await this.serviceService.getServiceById(id);
    if (!service) {
      return res.status(404).json(
        createApiResponse(false, 'Service not found')
      );
    }

    # Check if user has sufficient balance
    const servicePrice = parseFloat(service.price);
    const userBalance = parseFloat(req.user!.walletBalance);

    if (userBalance < servicePrice) {
      return res.status(400).json(
        createApiResponse(false, 'Insufficient wallet balance')
      );
    }

    # Process booking (this would involve creating a transaction and updating balances)
    await this.serviceService.incrementBookings(id);

    res.json(
      createApiResponse(true, 'Service booked successfully', {
        serviceId: id,
        price: servicePrice,
        status: 'booked'
      })
    );
  });
}
EOF

# 10. src/controllers/payment.controller.ts
cat << 'EOF' > src/controllers/payment.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { PaymentService } from '@/services/payment.service';
import { createApiResponse } from '@/utils/helpers';
import { asyncHandler } from '@/middleware/error.middleware';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  createOrder = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { amount, purpose } = req.body;

    const orderData = await this.paymentService.createPaymentOrder(
      req.user!.id,
      amount,
      purpose
    );

    res.status(201).json(
      createApiResponse(true, 'Payment order created successfully', orderData)
    );
  });

  verifyPayment = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const verificationData = req.body;

    const result = await this.paymentService.verifyPayment(verificationData, req.user!.id);

    res.json(
      createApiResponse(true, 'Payment verified successfully', result)
    );
  });

  handleWebhook = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { event, payload } = req.body;

    # Handle different webhook events
    switch (event) {
      case 'payment.failed':
        await this.paymentService.handlePaymentFailure(
          payload.order.id,
          payload.error.description
        );
        break;
      # Add more webhook event handlers as needed
    }

    res.json({ status: 'ok' });
  });

  processRefund = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { paymentId, amount } = req.body;

    const result = await this.paymentService.processRefund(paymentId, amount, req.user!.id);

    res.json(
      createApiResponse(true, 'Refund processed successfully', result)
    );
  });
}
EOF

# 10. src/controllers/conversion.controller.ts
cat << 'EOF' > src/controllers/conversion.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { ConversionService } from '@/services/conversion.service';
import { createApiResponse, validatePaginationParams } from '@/utils/helpers';
import { asyncHandler } from '@/middleware/error.middleware';

export class ConversionController {
  private conversionService: ConversionService;

  constructor() {
    this.conversionService = new ConversionService();
  }

  createRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { amount, bankDetails } = req.body;

    const request = await this.conversionService.createConversionRequest(
      req.user!.id,
      amount,
      bankDetails
    );

    res.status(201).json(
      createApiResponse(true, 'Conversion request created successfully', request)
    );
  });

  getRequests = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const pagination = validatePaginationParams(req.query.page, req.query.limit);
    const organizationId = req.user!.role === 'org' ? req.user!.id : undefined;

    const result = await this.conversionService.getConversionRequests(pagination, organizationId);

    res.json(
      createApiResponse(true, 'Conversion requests retrieved successfully', result.data, undefined, result.pagination)
    );
  });

  getRequestById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const request = await this.conversionService.getConversionRequestById(id);
    if (!request) {
      return res.status(404).json(
        createApiResponse(false, 'Conversion request not found')
      );
    }

    res.json(
      createApiResponse(true, 'Conversion request retrieved successfully', request)
    );
  });

  approveRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { transactionId } = req.body;

    const request = await this.conversionService.approveConversionRequest(
      id,
      req.user!.id,
      transactionId
    );

    res.json(
      createApiResponse(true, 'Conversion request approved successfully', request)
    );
  });

  rejectRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await this.conversionService.rejectConversionRequest(
      id,
      req.user!.id,
      reason
    );

    res.json(
      createApiResponse(true, 'Conversion request rejected successfully', request)
    );
  });
}
EOF

# 10. src/controllers/transaction.controller.ts
cat << 'EOF' > src/controllers/transaction.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { TransactionService } from '@/services/transaction.service';
import { createApiResponse, validatePaginationParams } from '@/utils/helpers';
import { asyncHandler } from '@/middleware/error.middleware';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  getTransactions = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const pagination = validatePaginationParams(req.query.page, req.query.limit);
    const filters = {
      userId: req.user!.role === 'admin' ? req.query.userId as string : req.user!.id,
      type: req.query.type as string,
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };

    const result = await this.transactionService.getTransactions(filters, pagination);

    res.json(
      createApiResponse(true, 'Transactions retrieved successfully', result.data, undefined, result.pagination)
    );
  });

  getTransactionById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const transaction = await this.transactionService.getTransactionById(id);
    if (!transaction) {
      return res.status(404).json(
        createApiResponse(false, 'Transaction not found')
      );
    }

    res.json(
      createApiResponse(true, 'Transaction retrieved successfully', transaction)
    );
  });

  getStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
    const stats = await this.transactionService.getTransactionStats(userId);

    res.json(
      createApiResponse(true, 'Transaction stats retrieved successfully', stats)
    );
  });

  getUserTransactionHistory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const pagination = validatePaginationParams(req.query.page, req.query.limit);

    const result = await this.transactionService.getUserTransactionHistory(req.user!.id, pagination);

    res.json(
      createApiResponse(true, 'Transaction history retrieved successfully', result.data, undefined, result.pagination)
    );
  });
}
EOF

# 10. src/controllers/admin.controller.ts
cat << 'EOF' > src/controllers/admin.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import { AdminService } from '@/services/admin.service';
import { ServiceService } from '@/services/service.service';
import { UserService } from '@/services/user.service';
import { AuditService } from '@/services/audit.service';
import { createApiResponse, validatePaginationParams, getClientIp, getUserAgent } from '@/utils/helpers';
import { asyncHandler } from '@/middleware/error.middleware';

export class AdminController {
  private adminService: AdminService;
  private serviceService: ServiceService;
  private userService: UserService;
  private auditService: AuditService;

  constructor() {
    this.adminService = new AdminService();
    this.serviceService = new ServiceService();
    this.userService = new UserService();
    this.auditService = new AuditService();
  }

  getDashboard = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const stats = await this.adminService.getDashboardStats();

    res.json(
      createApiResponse(true, 'Dashboard stats retrieved successfully', stats)
    );
  });

  getRecentActivity = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const activity = await this.adminService.getRecentActivity(limit);

    res.json(
      createApiResponse(true, 'Recent activity retrieved successfully', activity)
    );
  });

  getSystemHealth = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const health = await this.adminService.getSystemHealth();

    res.json(
      createApiResponse(true, 'System health retrieved successfully', health)
    );
  });

  approveService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const service = await this.serviceService.approveService(id, req.user!.id, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'Service approved successfully', service)
    );
  });

  suspendUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { reason } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const user = await this.userService.suspendUser(id, req.user!.id, reason, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'User suspended successfully', user)
    );
  });

  reactivateUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const user = await this.userService.reactivateUser(id, req.user!.id, ipAddress, userAgent);

    res.json(
      createApiResponse(true, 'User reactivated successfully', user)
    );
  });

  getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const pagination = validatePaginationParams(req.query.page, req.query.limit);
    const filters = {
      userId: req.query.userId as string,
      action: req.query.action as string,
      resource: req.query.resource as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    };

    const result = await this.auditService.getAuditLogs(filters, pagination);

    res.json(
      createApiResponse(true, 'Audit logs retrieved successfully', result.data, undefined, result.pagination)
    );
  });
}
EOF

# 11. src/routes/auth.routes.ts
cat << 'EOF' > src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { validateBody } from '@/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const authController = new AuthController();

# Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('user', 'org').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

# Routes
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/password', authenticateToken, validateBody(updatePasswordSchema), authController.updatePassword);
router.post('/verify-email', authenticateToken, authController.verifyEmail);
router.post('/logout', authenticateToken, authController.logout);

export default router;
EOF

# 11. src/routes/user.routes.ts
cat << 'EOF' > src/routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { checkOwnership, requireAnyRole } from '@/middleware/role.middleware';
import { validateBody, validateParams } from '@/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const userController = new UserController();

# Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().optional(),
  address: Joi.object().optional(),
  preferences: Joi.object().optional(),
  profileImage: Joi.string().uri().optional()
});

const userIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

# Routes
router.get('/profile', authenticateToken, requireAnyRole, userController.getProfile);
router.put('/profile', authenticateToken, requireAnyRole, validateBody(updateProfileSchema), userController.updateProfile);
router.get('/wallet', authenticateToken, requireAnyRole, userController.getWalletBalance);
router.get('/:id', authenticateToken, validateParams(userIdSchema), checkOwnership, userController.getUserById);

export default router;
EOF

# 11. src/routes/service.routes.ts
cat << 'EOF' > src/routes/service.routes.ts
import { Router } from 'express';
import { ServiceController } from '@/controllers/service.controller';
import { authenticateToken, optionalAuth } from '@/middleware/auth.middleware';
import { requireOrg, requireOrgOrAdmin, requireUser } from '@/middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '@/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const serviceController = new ServiceController();

# Validation schemas
const createServiceSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(20).max(2000).required(),
  price: Joi.number().min(1).max(1000000).required(),
  category: Joi.string().required(),
  features: Joi.array().items(Joi.string()).required(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  metadata: Joi.object().optional()
});

const updateServiceSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(20).max(2000).optional(),
  price: Joi.number().min(1).max(1000000).optional(),
  category: Joi.string().optional(),
  features: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  metadata: Joi.object().optional()
});

const serviceIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const getServicesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  category: Joi.string().optional(),
  search: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  status: Joi.string().valid('active', 'inactive', 'pending', 'suspended').optional(),
  organizationId: Joi.string().uuid().optional(),
  sortBy: Joi.string().valid('createdAt', 'price', 'rating').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional()
});

const addReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  review: Joi.string().max(1000).optional()
});

# Routes
router.post('/', authenticateToken, requireOrg, validateBody(createServiceSchema), serviceController.createService);
router.get('/', optionalAuth, validateQuery(getServicesQuerySchema), serviceController.getServices);
router.get('/:id', optionalAuth, validateParams(serviceIdSchema), serviceController.getServiceById);
router.put('/:id', authenticateToken, requireOrgOrAdmin, validateParams(serviceIdSchema), validateBody(updateServiceSchema), serviceController.updateService);
router.delete('/:id', authenticateToken, requireOrgOrAdmin, validateParams(serviceIdSchema), serviceController.deleteService);
router.post('/:id/reviews', authenticateToken, requireUser, validateParams(serviceIdSchema), validateBody(addReviewSchema), serviceController.addReview);
router.post('/:id/book', authenticateToken, requireUser, validateParams(serviceIdSchema), serviceController.bookService);

export default router;
EOF

# 11. src/routes/payment.routes.ts
cat << 'EOF' > src/routes/payment.routes.ts
import { Router } from 'express';
import { PaymentController } from '@/controllers/payment.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireUser, requireAdmin } from '@/middleware/role.middleware';
import { validateBody } from '@/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const paymentController = new PaymentController();

# Validation schemas
const createOrderSchema = Joi.object({
  amount: Joi.number().min(10).max(1000000).required(),
  purpose: Joi.string().valid('coin_purchase', 'service_booking').optional()
});

const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required()
});

const refundSchema = Joi.object({
  paymentId: Joi.string().required(),
  amount: Joi.number().min(1).optional()
});

# Routes
router.post('/orders', authenticateToken, requireUser, validateBody(createOrderSchema), paymentController.createOrder);
router.post('/verify', authenticateToken, requireUser, validateBody(verifyPaymentSchema), paymentController.verifyPayment);
router.post('/webhook', paymentController.handleWebhook); # No auth for webhooks
router.post('/refund', authenticateToken, requireAdmin, validateBody(refundSchema), paymentController.processRefund);

export default router;
EOF

# 11. src/routes/conversion.routes.ts
cat << 'EOF' > src/routes/conversion.routes.ts
import { Router } from 'express';
import { ConversionController } from '@/controllers/conversion.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireOrg, requireAdmin, requireOrgOrAdmin } from '@/middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '@/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const conversionController = new ConversionController();

# Validation schemas
const createRequestSchema = Joi.object({
  amount: Joi.number().min(50).max(100000).required(),
  bankDetails: Joi.object({
    accountNumber: Joi.string().required(),
    ifscCode: Joi.string().required(),
    accountHolderName: Joi.string().required(),
    bankName: Joi.string().required()
  }).required()
});

const requestIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const approveRequestSchema = Joi.object({
  transactionId: Joi.string().optional()
});

const rejectRequestSchema = Joi.object({
  reason: Joi.string().min(10).max(500).required()
});

const getRequestsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

# Routes
router.post('/', authenticateToken, requireOrg, validateBody(createRequestSchema), conversionController.createRequest);
router.get('/', authenticateToken, requireOrgOrAdmin, validateQuery(getRequestsQuerySchema), conversionController.getRequests);
router.get('/:id', authenticateToken, requireOrgOrAdmin, validateParams(requestIdSchema), conversionController.getRequestById);
router.post('/:id/approve', authenticateToken, requireAdmin, validateParams(requestIdSchema), validateBody(approveRequestSchema), conversionController.approveRequest);
router.post('/:id/reject', authenticateToken, requireAdmin, validateParams(requestIdSchema), validateBody(rejectRequestSchema), conversionController.rejectRequest);

export default router;
EOF

# 11. src/routes/transaction.routes.ts
cat << 'EOF' > src/routes/transaction.routes.ts
import { Router } from 'express';
import { TransactionController } from '@/controllers/transaction.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireAnyRole, requireAdmin } from '@/middleware/role.middleware';
import { validateParams, validateQuery } from '@/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const transactionController = new TransactionController();

# Validation schemas
const transactionIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const getTransactionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  type: Joi.string().valid('coin_purchase', 'service_booking', 'coin_conversion', 'refund').optional(),
  status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled').optional(),
  userId: Joi.string().uuid().optional(),
  serviceId: Joi.string().uuid().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional()
});

# Routes
router.get('/', authenticateToken, requireAnyRole, validateQuery(getTransactionsQuerySchema), transactionController.getTransactions);
router.get('/stats', authenticateToken, requireAnyRole, transactionController.getStats);
router.get('/history', authenticateToken, requireAnyRole, transactionController.getUserTransactionHistory);
router.get('/:id', authenticateToken, requireAnyRole, validateParams(transactionIdSchema), transactionController.getTransactionById);

export default router;
EOF

# 11. src/routes/admin.routes.ts
cat << 'EOF' > src/routes/admin.routes.ts
import { Router } from 'express';
import { AdminController } from '@/controllers/admin.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { requireAdmin } from '@/middleware/role.middleware';
import { validateParams, validateQuery, validateBody } from '@/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const adminController = new AdminController();

# Validation schemas
const userIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const serviceIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const suspendUserSchema = Joi.object({
  reason: Joi.string().min(10).max(500).required()
});

const getAuditLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  userId: Joi.string().uuid().optional(),
  action: Joi.string().optional(),
  resource: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional()
});

const recentActivityQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).optional()
});

# Routes - All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/activity', validateQuery(recentActivityQuerySchema), adminController.getRecentActivity);
router.get('/health', adminController.getSystemHealth);
router.post('/services/:id/approve', validateParams(serviceIdSchema), adminController.approveService);
router.post('/users/:id/suspend', validateParams(userIdSchema), validateBody(suspendUserSchema), adminController.suspendUser);
router.post('/users/:id/reactivate', validateParams(userIdSchema), adminController.reactivateUser);
router.get('/audit-logs', validateQuery(getAuditLogsQuerySchema), adminController.getAuditLogs);

export default router;
EOF

# 12. src/app.ts
cat << 'EOF' > src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

# Import configurations
import { testConnection } from '@/config/database';
import { testSupabaseConnection } from '@/config/supabase';
import { testRazorpayConnection } from '@/config/razorpay';

# Import middleware
import { errorHandler, notFound } from '@/middleware/error.middleware';

# Import routes
import authRoutes from '@/routes/auth.routes';
import userRoutes from '@/routes/user.routes';
import serviceRoutes from '@/routes/service.routes';
import paymentRoutes from '@/routes/payment.routes';
import conversionRoutes from '@/routes/conversion.routes';
import transactionRoutes from '@/routes/transaction.routes';
import adminRoutes from '@/routes/admin.routes';

# Import utils
import { logger } from '@/utils/logger';
import { createApiResponse } from '@/utils/helpers';
import { API_PREFIX } from '@/utils/constants';

# Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

# Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

# CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

# Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), # 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

# Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

# Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

# Health check endpoint
app.get('/health', (req, res) => {
  res.json(
    createApiResponse(true, 'Server is healthy', {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    })
  );
});

# API documentation endpoint
app.get('/api', (req, res) => {
  res.json(
    createApiResponse(true, 'ErthaExchange API', {
      version: 'v1',
      documentation: '/api/docs',
      endpoints: {
        auth: `${API_PREFIX}/auth`,
        users: `${API_PREFIX}/users`,
        services: `${API_PREFIX}/services`,
        payments: `${API_PREFIX}/payments`,
        conversions: `${API_PREFIX}/conversions`,
        transactions: `${API_PREFIX}/transactions`,
        admin: `${API_PREFIX}/admin`
      }
    })
  );
});

# API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/services`, serviceRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/conversions`, conversionRoutes);
app.use(`${API_PREFIX}/transactions`, transactionRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

# 404 handler
app.use(notFound);

# Global error handler
app.use(errorHandler);

# Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      logger.error('Error during graceful shutdown:', err);
      process.exit(1);
    }
    
    logger.info('Server closed successfully');
    process.exit(0);
  });
};

# Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

# Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

# Start server
const server = app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  
  # Test connections
  try {
    const dbConnected = await testConnection();
    const supabaseConnected = await testSupabaseConnection();
    const razorpayConnected = await testRazorpayConnection();
    
    if (dbConnected && supabaseConnected && razorpayConnected) {
      logger.info('All services connected successfully');
    } else {
      logger.warn('Some services failed to connect. Check configurations.');
    }
  } catch (error) {
    logger.error('Failed to test connections:', error);
  }
});

export default app;
EOF

# 13. migrations/0001_initial_schema.sql
cat << 'EOF' > migrations/0001_initial_schema.sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    wallet_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    email_verified BOOLEAN NOT NULL DEFAULT false,
    profile_image TEXT,
    phone TEXT,
    address JSONB,
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    features JSONB NOT NULL DEFAULT '[]',
    images JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    bookings INTEGER NOT NULL DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    description TEXT NOT NULL,
    metadata JSONB,
    payment_id TEXT,
    payment_method TEXT,
    balance_before DECIMAL(12,2),
    balance_after DECIMAL(12,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Conversion requests table
CREATE TABLE IF NOT EXISTS conversion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending',
    reason TEXT,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP,
    bank_details JSONB,
    transaction_id TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Service reviews table
CREATE TABLE IF NOT EXISTS service_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(service_id, user_id)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversion_requests_updated_at BEFORE UPDATE ON conversion_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_reviews_updated_at BEFORE UPDATE ON service_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF

# 13. migrations/0002_payment_tables.sql
cat << 'EOF' > migrations/0002_payment_tables.sql
-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    details JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL,
    provider TEXT,
    gateway TEXT NOT NULL DEFAULT 'razorpay',
    gateway_response JSONB,
    failure_reason TEXT,
    refund_id TEXT,
    refund_amount DECIMAL(12,2),
    refund_status TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF

# 13. migrations/0003_indexes_and_triggers.sql
cat << 'EOF' > migrations/0003_indexes_and_triggers.sql
-- Indexes for better performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);

-- Services table indexes
CREATE INDEX IF NOT EXISTS services_org_idx ON services(organization_id);
CREATE INDEX IF NOT EXISTS services_category_idx ON services(category);
CREATE INDEX IF NOT EXISTS services_status_idx ON services(status);
CREATE INDEX IF NOT EXISTS services_created_at_idx ON services(created_at);
CREATE INDEX IF NOT EXISTS services_price_idx ON services(price);
CREATE INDEX IF NOT EXISTS services_rating_idx ON services(rating);

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS transactions_user_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_service_idx ON transactions(service_id);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON transactions(type);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);
CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions(created_at);
CREATE INDEX IF NOT EXISTS transactions_payment_id_idx ON transactions(payment_id);

-- Conversion requests table indexes
CREATE INDEX IF NOT EXISTS conversion_requests_org_idx ON conversion_requests(organization_id);
CREATE INDEX IF NOT EXISTS conversion_requests_status_idx ON conversion_requests(status);
CREATE INDEX IF NOT EXISTS conversion_requests_created_at_idx ON conversion_requests(created_at);

-- Service reviews table indexes
CREATE INDEX IF NOT EXISTS service_reviews_service_idx ON service_reviews(service_id);
CREATE INDEX IF NOT EXISTS service_reviews_user_idx ON service_reviews(user_id);
CREATE INDEX IF NOT EXISTS service_reviews_rating_idx ON service_reviews(rating);
CREATE INDEX IF NOT EXISTS service_reviews_created_at_idx ON service_reviews(created_at);

-- Payment methods table indexes
CREATE INDEX IF NOT EXISTS payment_methods_user_idx ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS payment_methods_type_idx ON payment_methods(type);

-- Payment transactions table indexes
CREATE INDEX IF NOT EXISTS payment_transactions_user_idx ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS payment_transactions_order_idx ON payment_transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS payment_transactions_payment_idx ON payment_transactions(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS payment_transactions_status_idx ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS payment_transactions_created_at_idx ON payment_transactions(created_at);

-- Audit logs table indexes
CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_resource_idx ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);

-- API keys table indexes
CREATE INDEX IF NOT EXISTS api_keys_user_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_key_idx ON api_keys(key);

-- Text search indexes for better search performance
CREATE INDEX IF NOT EXISTS services_title_text_idx ON services USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS services_description_text_idx ON services USING gin(to_tsvector('english', description));

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS services_status_category_idx ON services(status, category);
CREATE INDEX IF NOT EXISTS transactions_user_type_idx ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS transactions_user_status_idx ON transactions(user_id, status);

-- Add constraints for data integrity
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'org', 'admin'));
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'suspended', 'inactive'));
ALTER TABLE users ADD CONSTRAINT users_wallet_balance_check CHECK (wallet_balance >= 0);

ALTER TABLE services ADD CONSTRAINT services_status_check CHECK (status IN ('active', 'inactive', 'pending', 'suspended'));
ALTER TABLE services ADD CONSTRAINT services_price_check CHECK (price > 0);
ALTER TABLE services ADD CONSTRAINT services_rating_check CHECK (rating >= 0 AND rating <= 5);

ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('coin_purchase', 'service_booking', 'coin_conversion', 'refund'));
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));
ALTER TABLE transactions ADD CONSTRAINT transactions_amount_check CHECK (amount > 0);

ALTER TABLE conversion_requests ADD CONSTRAINT conversion_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'processed'));
ALTER TABLE conversion_requests ADD CONSTRAINT conversion_requests_amount_check CHECK (amount > 0);

ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));
ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_amount_check CHECK (amount > 0);

-- Function to automatically update service ratings when reviews are added/updated
CREATE OR REPLACE FUNCTION update_service_rating()
RETURNS TRIGGER AS $
BEGIN
    UPDATE services 
    SET rating = (
        SELECT ROUND(AVG(rating::numeric), 2)
        FROM service_reviews 
        WHERE service_id = COALESCE(NEW.service_id, OLD.service_id) AND is_visible = true
    ),
    review_count = (
        SELECT COUNT(*)
        FROM service_reviews 
        WHERE service_id = COALESCE(NEW.service_id, OLD.service_id) AND is_visible = true
    )
    WHERE id = COALESCE(NEW.service_id, OLD.service_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

-- Triggers for automatic service rating updates
CREATE TRIGGER update_service_rating_on_review_insert
    AFTER INSERT ON service_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_service_rating();

CREATE TRIGGER update_service_rating_on_review_update
    AFTER UPDATE ON service_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_service_rating();

CREATE TRIGGER update_service_rating_on_review_delete
    AFTER DELETE ON service_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_service_rating();
EOF

# 14. tsconfig.json
cat << 'EOF' > tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/config/*": ["src/config/*"],
      "@/controllers/*": ["src/controllers/*"],
      "@/middleware/*": ["src/middleware/*"],
      "@/models/*": ["src/models/*"],
      "@/routes/*": ["src/routes/*"],
      "@/services/*": ["src/services/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"]
    },
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": [
    "src/**/*",
    "scripts/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "ts-node": {
    "require": ["tsconfig-paths/register"]
  }
}
EOF

# 14. drizzle.config.ts
cat << 'EOF' > drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/models/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
EOF

# 15. src/utils/validation.ts
cat << 'EOF' > src/utils/validation.ts
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
EOF

# 16. scripts/seed.ts
cat << 'EOF' > scripts/seed.ts
import { db } from '../src/config/database';
import { users, services, transactions } from '../src/models/schema';
import { hashPassword } from '../src/utils/helpers';
import { USER_ROLES, SERVICE_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS } from '../src/utils/constants';
import { logger } from '../src/utils/logger';

async function seed() {
  try {
    logger.info('Starting database seeding...');

    # Create admin user
    const adminPassword = await hashPassword(process.env.ADMIN_PASSWORD || 'admin123');
    const [admin] = await db
      .insert(users)
      .values({
        name: 'System Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@erthaexchange.com',
        password: adminPassword,
        role: USER_ROLES.ADMIN,
        status: 'active',
        emailVerified: true,
        walletBalance: '10000'
      })
      .returning();

    logger.info(`Admin user created: ${admin.email}`);

    # Create sample organization
    const orgPassword = await hashPassword('org123');
    const [organization] = await db
      .insert(users)
      .values({
        name: 'Tech Solutions Inc',
        email: 'org@techsolutions.com',
        password: orgPassword,
        role: USER_ROLES.ORG,
        status: 'active',
        emailVerified: true,
        walletBalance: '5000'
      })
      .returning();

    logger.info(`Organization user created: ${organization.email}`);

    # Create sample regular users
    const userPassword = await hashPassword('user123');
    const sampleUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: userPassword,
        role: USER_ROLES.USER,
        status: 'active',
        emailVerified: true,
        walletBalance: '1000'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: userPassword,
        role: USER_ROLES.USER,
        status: 'active',
        emailVerified: true,
        walletBalance: '1500'
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: userPassword,
        role: USER_ROLES.USER,
        status: 'active',
        emailVerified: true,
        walletBalance: '800'
      }
    ];

    const createdUsers = await db
      .insert(users)
      .values(sampleUsers)
      .returning();

    logger.info(`Created ${createdUsers.length} sample users`);

    # Create sample services
    const sampleServices = [
      {
        title: 'Web Development Services',
        description: 'Professional web development services including frontend and backend development, database design, and deployment.',
        price: '299.99',
        category: 'technology',
        organizationId: organization.id,
        status: SERVICE_STATUS.ACTIVE,
        features: ['React/Angular Development', 'Node.js Backend', 'Database Design', 'API Integration', 'Deployment Support'],
        tags: ['web', 'development', 'react', 'nodejs'],
        bookings: 25,
        rating: '4.8'
      },
      {
        title: 'Digital Marketing Consultation',
        description: 'Comprehensive digital marketing consultation including SEO, social media strategy, and content marketing.',
        price: '199.99',
        category: 'marketing',
        organizationId: organization.id,
        status: SERVICE_STATUS.ACTIVE,
        features: ['SEO Audit', 'Social Media Strategy', 'Content Planning', 'Analytics Setup', 'Performance Tracking'],
        tags: ['marketing', 'seo', 'social-media', 'content'],
        bookings: 18,
        rating: '4.6'
      },
      {
        title: 'Business Strategy Consulting',
        description: 'Expert business strategy consulting to help grow your business and optimize operations.',
        price: '399.99',
        category: 'consulting',
        organizationId: organization.id,
        status: SERVICE_STATUS.ACTIVE,
        features: ['Market Analysis', 'Strategy Development', 'Implementation Planning', 'Performance Metrics', 'Ongoing Support'],
        tags: ['business', 'strategy', 'consulting', 'growth'],
        bookings: 12,
        rating: '4.9'
      },
      {
        title: 'Graphic Design Services',
        description: 'Creative graphic design services for branding, marketing materials, and digital assets.',
        price: '149.99',
        category: 'design',
        organizationId: organization.id,
        status: SERVICE_STATUS.PENDING,
        features: ['Logo Design', 'Brand Identity', 'Marketing Materials', 'Digital Assets', 'Print Design'],
        tags: ['design', 'graphics', 'branding', 'creative'],
        bookings: 8,
        rating: '4.7'
      }
    ];

    const createdServices = await db
      .insert(services)
      .values(sampleServices)
      .returning();

    logger.info(`Created ${createdServices.length} sample services`);

    # Create sample transactions
    const sampleTransactions = [
      {
        userId: createdUsers[0].id,
        type: TRANSACTION_TYPES.COIN_PURCHASE,
        amount: '1000',
        status: TRANSACTION_STATUS.COMPLETED,
        description: 'Coin purchase via Razorpay',
        paymentMethod: 'razorpay',
        balanceBefore: '0',
        balanceAfter: '1000'
      },
      {
        userId: createdUsers[1].id,
        type: TRANSACTION_TYPES.COIN_PURCHASE,
        amount: '1500',
        status: TRANSACTION_STATUS.COMPLETED,
        description: 'Coin purchase via Razorpay',
        paymentMethod: 'razorpay',
        balanceBefore: '0',
        balanceAfter: '1500'
      },
      {
        userId: createdUsers[0].id,
        serviceId: createdServices[0].id,
        type: TRANSACTION_TYPES.SERVICE_BOOKING,
        amount: '299.99',
        status: TRANSACTION_STATUS.COMPLETED,
        description: 'Service booking: Web Development Services',
        balanceBefore: '1000',
        balanceAfter: '700.01'
      },
      {
        userId: organization.id,
        type: TRANSACTION_TYPES.COIN_CONVERSION,
        amount: '5000',
        status: TRANSACTION_STATUS.COMPLETED,
        description: 'Coin conversion to bank account',
        balanceBefore: '10000',
        balanceAfter: '5000'
      }
    ];

    const createdTransactions = await db
      .insert(transactions)
      .values(sampleTransactions)
      .returning();

    logger.info(`Created ${createdTransactions.length} sample transactions`);

    logger.info('Database seeding completed successfully!');
    logger.info('\\n--- Sample Credentials ---');
    logger.info(`Admin: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    logger.info(`Organization: ${organization.email} / org123`);
    logger.info(`User: ${createdUsers[0].email} / user123`);
    logger.info('-------------------------\\n');

  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

# Run seed if this file is executed directly
if (require.main === module) {
  seed();
}

export default seed;
EOF

# 17. README.md
cat << 'EOF' > README.md
# ErthaExchange Backend

A comprehensive backend system for the ErthaExchange platform - a coin-based service marketplace where users can purchase coins, organizations can list services, and seamless transactions occur between parties.

## 🚀 Features

- **User Management**: Registration, authentication, profile management
- **Service Marketplace**: Organizations can list services, users can browse and book
- **Coin System**: Purchase coins, use for services, conversion back to currency
- **Payment Integration**: Razorpay integration for secure payments
- **Transaction Management**: Complete audit trail of all transactions
- **Admin Dashboard**: Comprehensive admin controls and analytics
- **Audit Logging**: Complete activity tracking for compliance
- **Rate Limiting**: Built-in API rate limiting for security
- **Real-time Notifications**: Event-driven notification system

## 🛠 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens
- **Payments**: Razorpay integration
- **Storage**: Supabase integration
- **Validation**: Joi schemas
- **Logging**: Winston logger
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- PostgreSQL database
- Supabase account
- Razorpay account (for payments)

## 🚦 Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd erthaexchange-backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxx

# Admin
ADMIN_EMAIL=admin@erthaexchange.com
ADMIN_PASSWORD=admin123
```

### 3. Database Setup

```bash
# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run seed
```

### 4. Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database, Supabase, Razorpay configs
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth, validation, error middleware
│   ├── models/          # Drizzle schema definitions
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper functions and constants
│   └── app.ts           # Main application file
├── migrations/          # Database migration files
└── scripts/             # Utility scripts
```

## 🔑 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/password` - Update password
- `POST /api/v1/auth/logout` - User logout

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/wallet` - Get wallet balance

### Services
- `POST /api/v1/services` - Create service (Organizations)
- `GET /api/v1/services` - List services with filters
- `GET /api/v1/services/:id` - Get service details
- `PUT /api/v1/services/:id` - Update service
- `DELETE /api/v1/services/:id` - Delete service
- `POST /api/v1/services/:id/book` - Book service
- `POST /api/v1/services/:id/reviews` - Add review

### Payments
- `POST /api/v1/payments/orders` - Create payment order
- `POST /api/v1/payments/verify` - Verify payment
- `POST /api/v1/payments/webhook` - Payment webhook
- `POST /api/v1/payments/refund` - Process refund (Admin)

### Conversions
- `POST /api/v1/conversions` - Request coin conversion
- `GET /api/v1/conversions` - List conversion requests
- `GET /api/v1/conversions/:id` - Get conversion details
- `POST /api/v1/conversions/:id/approve` - Approve conversion (Admin)
- `POST /api/v1/conversions/:id/reject` - Reject conversion (Admin)

### Transactions
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/transactions/:id` - Get transaction details
- `GET /api/v1/transactions/stats` - Transaction statistics
- `GET /api/v1/transactions/history` - User transaction history

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard statistics
- `GET /api/v1/admin/activity` - Recent activity
- `GET /api/v1/admin/health` - System health check
- `POST /api/v1/admin/services/:id/approve` - Approve service
- `POST /api/v1/admin/users/:id/suspend` - Suspend user
- `POST /api/v1/admin/users/:id/reactivate` - Reactivate user
- `GET /api/v1/admin/audit-logs` - Audit logs

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: User, Organization, Admin roles
- **Rate Limiting**: Configurable rate limits per endpoint
- **Input Validation**: Comprehensive Joi validation schemas
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM
- **CORS Protection**: Configurable CORS policies
- **Helmet Security**: Security headers and protection
- **Audit Logging**: Complete activity tracking

## 💳 Payment Flow

1. **Create Order**: Frontend requests payment order creation
2. **Process Payment**: User completes payment via Razorpay
3. **Verify Payment**: Backend verifies payment signature
4. **Update Balance**: User's coin balance is updated
5. **Audit Trail**: Transaction is logged for compliance

## 🔄 Conversion Flow

1. **Request Conversion**: Organization requests coin-to-currency conversion
2. **Admin Review**: Admin reviews and approves/rejects request
3. **Process Transfer**: Bank transfer is initiated (external process)
4. **Update Balance**: Organization's coin balance is debited
5. **Completion**: Conversion is marked as completed

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📊 Monitoring & Logging

- **Winston Logging**: Structured logging with multiple transports
- **Health Endpoints**: Built-in health check endpoints
- **Error Tracking**: Comprehensive error handling and reporting
- **Audit Trails**: Complete activity logging for compliance

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
RAZORPAY_KEY_ID=your-production-razorpay-key
RAZORPAY_KEY_SECRET=your-production-razorpay-secret
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact:
- Email: support@erthaexchange.com
- Documentation: [API Documentation](https://docs.erthaexchange.com)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 🔄 Changelog

### v1.0.0
- Initial release with core functionality
- User management and authentication
- Service marketplace
- Payment integration
- Admin dashboard
- Audit logging
EOF

echo "All files and directories created successfully in the '$BASE_DIR' directory."
echo "You can now navigate into the '$BASE_DIR' directory and follow the README.md instructions."
