import { pgTable, text, integer, timestamp, boolean, json, decimal, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'), // user, org, admin
  walletBalance: decimal('wallet_balance', { precision: 10, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('active'), // active, suspended
  emailVerified: boolean('email_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  organizationId: uuid('organization_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // active, inactive, pending
  features: json('features').$type<string[]>().notNull().default([]),
  bookings: integer('bookings').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),
  type: text('type').notNull(), // coin_purchase, service_booking, coin_conversion
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'), // pending, completed, failed
  description: text('description').notNull(),
  metadata: json('metadata').$type<Record<string, any>>(),
  paymentId: text('payment_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const conversionRequests = pgTable('conversion_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('INR'),
  status: text('status').notNull().default('pending'), // pending, approved, rejected
  reason: text('reason'),
  processedBy: uuid('processed_by').references(() => users.id, { onDelete: 'set null' }),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

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
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  services: many(services),
  transactions: many(transactions),
  conversionRequests: many(conversionRequests),
  auditLogs: many(auditLogs)
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  organization: one(users, {
    fields: [services.organizationId],
    references: [users.id]
  }),
  transactions: many(transactions)
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id]
  }),
  service: one(services, {
    fields: [transactions.serviceId],
    references: [services.id]
  })
}));

export const conversionRequestsRelations = relations(conversionRequests, ({ one }) => ({
  organization: one(users, {
    fields: [conversionRequests.organizationId],
    references: [users.id]
  }),
  processedBy: one(users, {
    fields: [conversionRequests.processedBy],
    references: [users.id]
  })
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id]
  })
}));

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // razorpay, card, upi, wallet
  provider: text('provider').notNull(), // razorpay, gpay, paytm, card
  isDefault: boolean('is_default').notNull().default(false),
  details: json('details').$type<{
    last4?: string;
    cardType?: string;
    upiId?: string;
    walletProvider?: string;
    holderName?: string;
  }>(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id, { onDelete: 'set null' }),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  razorpaySignature: text('razorpay_signature'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('INR'),
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed, cancelled
  paymentMethod: text('payment_method').notNull(), // card, netbanking, wallet, upi
  provider: text('provider'), // razorpay, gpay, paytm, etc.
  gateway: text('gateway').notNull().default('razorpay'),
  gatewayResponse: json('gateway_response'),
  failureReason: text('failure_reason'),
  refundId: text('refund_id'),
  refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }),
  refundStatus: text('refund_status'), // pending, processed, failed
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Add relations
export const paymentMethodsRelations = relations(paymentMethods, ({ one, many }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id]
  }),
  paymentTransactions: many(paymentTransactions)
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
  })
}));