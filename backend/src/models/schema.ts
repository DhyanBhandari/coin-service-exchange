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
