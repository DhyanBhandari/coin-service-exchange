import { pgTable, text, integer, timestamp, boolean, json, decimal, uuid, index, uniqueIndex, serial, varchar, jsonb, foreignKey, interval } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firebaseUid: varchar('firebase_uid', { length: 128 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  walletBalance: decimal('wallet_balance', { precision: 10, scale: 2 }).default('0.00'),
  emailVerified: boolean('email_verified').default(false),
  isActive: boolean('is_active').default(true),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  profileImage: text('profile_image'),
  dateOfBirth: timestamp('date_of_birth'),
  preferences: jsonb('preferences'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Services table
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  shortDescription: text('short_description'),
  category: text('category').notNull(),
  subCategory: text('sub_category'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('INR'),
  location: text('location'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }).default('India'),
  coordinates: jsonb('coordinates'),
  duration: varchar('duration', { length: 100 }),
  capacity: integer('capacity'),
  minBookings: integer('min_bookings').default(1),
  maxBookings: integer('max_bookings'),
  availableSlots: integer('available_slots'),
  tags: json('tags').$type<string[]>().default([]),
  features: json('features').$type<string[]>().default([]),
  inclusions: json('inclusions').$type<string[]>().default([]),
  exclusions: json('exclusions').$type<string[]>().default([]),
  images: json('images').$type<string[]>().default([]),
  videos: json('videos').$type<string[]>().default([]),
  documents: json('documents').$type<string[]>().default([]),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  reviewCount: integer('review_count').default(0),
  bookingCount: integer('booking_count').default(0),
  viewCount: integer('view_count').default(0),
  favoriteCount: integer('favorite_count').default(0),
  status: text('status').default('pending'),
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  isPromoted: boolean('is_promoted').default(false),
  availableFrom: timestamp('available_from'),
  availableTo: timestamp('available_to'),
  availabilitySchedule: jsonb('availability_schedule'),
  maxBookingsPerUser: integer('max_bookings_per_user').default(1),
  cancellationPolicy: text('cancellation_policy'),
  refundPolicy: text('refund_policy'),
  termsAndConditions: text('terms_and_conditions'),
  requirements: text('requirements'),
  ageRestriction: integer('age_restriction'),
  skillLevel: varchar('skill_level', { length: 50 }),
  language: varchar('language', { length: 50 }).default('English'),
  contactInfo: jsonb('contact_info'),
  metadata: jsonb('metadata'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  seoKeywords: json('seo_keywords').$type<string[]>().default([]),
  adminNotes: text('admin_notes'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  lastModifiedBy: uuid('last_modified_by'),
  publishedAt: timestamp('published_at'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  organizationIdx: index('services_organization_idx').on(table.organizationId),
  categoryIdx: index('services_category_idx').on(table.category),
  subCategoryIdx: index('services_sub_category_idx').on(table.subCategory),
  statusIdx: index('services_status_idx').on(table.status),
  priceIdx: index('services_price_idx').on(table.price),
  locationIdx: index('services_location_idx').on(table.location),
  cityIdx: index('services_city_idx').on(table.city),
  isActiveIdx: index('services_is_active_idx').on(table.isActive),
  isFeaturedIdx: index('services_is_featured_idx').on(table.isFeatured),
  ratingIdx: index('services_rating_idx').on(table.rating),
  createdAtIdx: index('services_created_at_idx').on(table.createdAt),
  availabilityIdx: index('services_availability_idx').on(table.availableFrom, table.availableTo),
  organizationFk: foreignKey({ columns: [table.organizationId], foreignColumns: [users.id], name: 'services_organization_fk' }),
  approvedByFk: foreignKey({ columns: [table.approvedBy], foreignColumns: [users.id], name: 'services_approved_by_fk' }),
  lastModifiedByFk: foreignKey({ columns: [table.lastModifiedBy], foreignColumns: [users.id], name: 'services_last_modified_by_fk' }),
}));

// Service bookings table
export const serviceBookings = pgTable('service_bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  serviceId: uuid('service_id').notNull(),
  userId: uuid('user_id').notNull(),
  bookingReference: varchar('booking_reference', { length: 50 }).unique(),
  quantity: integer('quantity').default(1),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  originalAmount: decimal('original_amount', { precision: 12, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0.00'),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).default('0.00'),
  processingFee: decimal('processing_fee', { precision: 12, scale: 2 }).default('0.00'),
  currency: varchar('currency', { length: 3 }).default('INR'),
  status: text('status').default('pending'),
  paymentStatus: text('payment_status').default('pending'),
  bookingDate: timestamp('booking_date'),
  serviceDate: timestamp('service_date'),
  checkinDate: timestamp('checkin_date'),
  checkoutDate: timestamp('checkout_date'),
  guestDetails: jsonb('guest_details'),
  specialRequests: text('special_requests'),
  notes: text('notes'),
  contactInfo: jsonb('contact_info'),
  cancellationReason: text('cancellation_reason'),
  cancelledAt: timestamp('cancelled_at'),
  cancelledBy: uuid('cancelled_by'),
  refundAmount: decimal('refund_amount', { precision: 12, scale: 2 }),
  refundReason: text('refund_reason'),
  refundedAt: timestamp('refunded_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  serviceIdx: index('service_bookings_service_idx').on(table.serviceId),
  userIdx: index('service_bookings_user_idx').on(table.userId),
  statusIdx: index('service_bookings_status_idx').on(table.status),
  paymentStatusIdx: index('service_bookings_payment_status_idx').on(table.paymentStatus),
  bookingRefIdx: uniqueIndex('service_bookings_ref_idx').on(table.bookingReference),
  serviceDateIdx: index('service_bookings_service_date_idx').on(table.serviceDate),
  createdAtIdx: index('service_bookings_created_at_idx').on(table.createdAt),
  serviceFk: foreignKey({ columns: [table.serviceId], foreignColumns: [services.id], name: 'service_bookings_service_fk' }),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: 'service_bookings_user_fk' }),
  cancelledByFk: foreignKey({ columns: [table.cancelledBy], foreignColumns: [users.id], name: 'service_bookings_cancelled_by_fk' }),
}));

// Transactions table (simplified version for backward compatibility)
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  serviceId: uuid('service_id'),
  type: varchar('type', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('INR'),
  status: varchar('status', { length: 20 }).default('pending'),
  description: text('description'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  paymentId: text('payment_id'),
  balanceBefore: decimal('balance_before', { precision: 12, scale: 2 }),
  balanceAfter: decimal('balance_after', { precision: 12, scale: 2 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('transactions_user_idx').on(table.userId),
  serviceIdx: index('transactions_service_idx').on(table.serviceId),
  typeIdx: index('transactions_type_idx').on(table.type),
  statusIdx: index('transactions_status_idx').on(table.status),
  createdAtIdx: index('transactions_created_at_idx').on(table.createdAt),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: 'transactions_user_fk' }),
  serviceFk: foreignKey({ columns: [table.serviceId], foreignColumns: [services.id], name: 'transactions_service_fk' }),
}));

// Conversion requests table
export const conversionRequests = pgTable('conversion_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('INR'),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }),
  convertedAmount: decimal('converted_amount', { precision: 12, scale: 2 }),
  status: text('status').default('pending'),
  priority: text('priority').default('normal'),
  reason: text('reason'),
  adminNotes: text('admin_notes'),
  processedBy: uuid('processed_by'),
  processedAt: timestamp('processed_at'),
  bankDetails: jsonb('bank_details'),
  transactionId: text('transaction_id'),
  paymentReference: text('payment_reference'),
  fees: decimal('fees', { precision: 12, scale: 2 }).default('0.00'),
  taxes: decimal('taxes', { precision: 12, scale: 2 }).default('0.00'),
  expectedProcessingTime: text('expected_processing_time'),
  actualProcessingTime: interval('actual_processing_time'),
  attachments: json('attachments').$type<string[]>().default([]),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  organizationIdx: index('conversion_requests_organization_idx').on(table.organizationId),
  statusIdx: index('conversion_requests_status_idx').on(table.status),
  priorityIdx: index('conversion_requests_priority_idx').on(table.priority),
  createdAtIdx: index('conversion_requests_created_at_idx').on(table.createdAt),
  organizationFk: foreignKey({ columns: [table.organizationId], foreignColumns: [users.id], name: 'conversion_requests_organization_fk' }),
  processedByFk: foreignKey({ columns: [table.processedBy], foreignColumns: [users.id], name: 'conversion_requests_processed_by_fk' }),
}));

// Payment methods table
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  isDefault: boolean('is_default').default(false),
  nickname: varchar('nickname', { length: 100 }),
  details: jsonb('details'),
  securityInfo: jsonb('security_info'),
  isActive: boolean('is_active').default(true),
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at'),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('payment_methods_user_idx').on(table.userId),
  typeIdx: index('payment_methods_type_idx').on(table.type),
  providerIdx: index('payment_methods_provider_idx').on(table.provider),
  isActiveIdx: index('payment_methods_is_active_idx').on(table.isActive),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: 'payment_methods_user_fk' }),
}));

// Payment transactions table
export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  transactionId: uuid('transaction_id'),
  paymentMethodId: uuid('payment_method_id'),
  bookingId: uuid('booking_id'),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  razorpaySignature: text('razorpay_signature'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('INR'),
  status: text('status').default('pending'),
  paymentMethod: text('payment_method').notNull(),
  provider: text('provider'),
  gateway: text('gateway').default('razorpay'),
  gatewayOrderId: text('gateway_order_id'),
  gatewayPaymentId: text('gateway_payment_id'),
  gatewayResponse: jsonb('gateway_response'),
  gatewayFee: decimal('gateway_fee', { precision: 12, scale: 2 }).default('0.00'),
  platformFee: decimal('platform_fee', { precision: 12, scale: 2 }).default('0.00'),
  taxes: decimal('taxes', { precision: 12, scale: 2 }).default('0.00'),
  netAmount: decimal('net_amount', { precision: 12, scale: 2 }),
  failureReason: text('failure_reason'),
  failureCode: text('failure_code'),
  retryCount: integer('retry_count').default(0),
  refundId: text('refund_id'),
  refundAmount: decimal('refund_amount', { precision: 12, scale: 2 }),
  refundStatus: text('refund_status'),
  refundReason: text('refund_reason'),
  refundedAt: timestamp('refunded_at'),
  capturedAt: timestamp('captured_at'),
  settledAt: timestamp('settled_at'),
  metadata: jsonb('metadata'),
  webhookData: jsonb('webhook_data'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceFingerprint: text('device_fingerprint'),
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
  fraudFlags: json('fraud_flags').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('payment_transactions_user_idx').on(table.userId),
  transactionIdx: index('payment_transactions_transaction_idx').on(table.transactionId),
  bookingIdx: index('payment_transactions_booking_idx').on(table.bookingId),
  razorpayOrderIdx: index('payment_transactions_razorpay_order_idx').on(table.razorpayOrderId),
  razorpayPaymentIdx: index('payment_transactions_razorpay_payment_idx').on(table.razorpayPaymentId),
  statusIdx: index('payment_transactions_status_idx').on(table.status),
  gatewayIdx: index('payment_transactions_gateway_idx').on(table.gateway),
  createdAtIdx: index('payment_transactions_created_at_idx').on(table.createdAt),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: 'payment_transactions_user_fk' }),
  paymentMethodFk: foreignKey({ columns: [table.paymentMethodId], foreignColumns: [paymentMethods.id], name: 'payment_transactions_payment_method_fk' }),
  bookingFk: foreignKey({ columns: [table.bookingId], foreignColumns: [serviceBookings.id], name: 'payment_transactions_booking_fk' }),
}));

// Service reviews table
export const serviceReviews = pgTable('service_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  serviceId: uuid('service_id').notNull(),
  userId: uuid('user_id').notNull(),
  bookingId: uuid('booking_id'),
  rating: integer('rating').notNull(),
  title: varchar('title', { length: 200 }),
  review: text('review'),
  pros: json('pros').$type<string[]>().default([]),
  cons: json('cons').$type<string[]>().default([]),
  images: json('images').$type<string[]>().default([]),
  videos: json('videos').$type<string[]>().default([]),
  tags: json('tags').$type<string[]>().default([]),
  isAnonymous: boolean('is_anonymous').default(false),
  isVerified: boolean('is_verified').default(false),
  isVisible: boolean('is_visible').default(true),
  isFeatured: boolean('is_featured').default(false),
  helpfulVotes: integer('helpful_votes').default(0),
  reportCount: integer('report_count').default(0),
  moderatedBy: uuid('moderated_by'),
  moderatedAt: timestamp('moderated_at'),
  moderationNotes: text('moderation_notes'),
  responseFromOrg: text('response_from_org'),
  respondedAt: timestamp('responded_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  serviceIdx: index('service_reviews_service_idx').on(table.serviceId),
  userIdx: index('service_reviews_user_idx').on(table.userId),
  bookingIdx: index('service_reviews_booking_idx').on(table.bookingId),
  ratingIdx: index('service_reviews_rating_idx').on(table.rating),
  isVisibleIdx: index('service_reviews_is_visible_idx').on(table.isVisible),
  isFeaturedIdx: index('service_reviews_is_featured_idx').on(table.isFeatured),
  createdAtIdx: index('service_reviews_created_at_idx').on(table.createdAt),
  serviceFk: foreignKey({ columns: [table.serviceId], foreignColumns: [services.id], name: 'service_reviews_service_fk' }),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: 'service_reviews_user_fk' }),
  bookingFk: foreignKey({ columns: [table.bookingId], foreignColumns: [serviceBookings.id], name: 'service_reviews_booking_fk' }),
  moderatedByFk: foreignKey({ columns: [table.moderatedBy], foreignColumns: [users.id], name: 'service_reviews_moderated_by_fk' }),
}));

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  sessionId: text('session_id'),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resource_id'),
  method: varchar('method', { length: 10 }),
  endpoint: text('endpoint'),
  statusCode: integer('status_code'),
  duration: integer('duration'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  changes: jsonb('changes'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  location: jsonb('location'),
  deviceInfo: jsonb('device_info'),
  severity: varchar('severity', { length: 20 }).default('info'),
  category: varchar('category', { length: 50 }),
  tags: json('tags').$type<string[]>().default([]),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('audit_logs_user_idx').on(table.userId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  resourceIdx: index('audit_logs_resource_idx').on(table.resource),
  categoryIdx: index('audit_logs_category_idx').on(table.category),
  severityIdx: index('audit_logs_severity_idx').on(table.severity),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  ipAddressIdx: index('audit_logs_ip_address_idx').on(table.ipAddress),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: 'audit_logs_user_fk' }),
}));

// API keys table
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  key: text('key').notNull().unique(),
  keyHash: text('key_hash').notNull(),
  permissions: json('permissions').$type<string[]>().default([]),
  scopes: json('scopes').$type<string[]>().default([]),
  rateLimit: integer('rate_limit').default(1000),
  usageCount: integer('usage_count').default(0),
  isActive: boolean('is_active').default(true),
  environment: varchar('environment', { length: 20 }).default('production'),
  allowedIps: json('allowed_ips').$type<string[]>().default([]),
  allowedDomains: json('allowed_domains').$type<string[]>().default([]),
  lastUsedAt: timestamp('last_used_at'),
  lastUsedIp: text('last_used_ip'),
  expiresAt: timestamp('expires_at'),
  revokedAt: timestamp('revoked_at'),
  revokedBy: uuid('revoked_by'),
  revocationReason: text('revocation_reason'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('api_keys_user_idx').on(table.userId),
  keyIdx: uniqueIndex('api_keys_key_idx').on(table.key),
  keyHashIdx: index('api_keys_key_hash_idx').on(table.keyHash),
  isActiveIdx: index('api_keys_is_active_idx').on(table.isActive),
  environmentIdx: index('api_keys_environment_idx').on(table.environment),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: 'api_keys_user_fk' }),
  revokedByFk: foreignKey({ columns: [table.revokedBy], foreignColumns: [users.id], name: 'api_keys_revoked_by_fk' }),
}));

// Password reset tokens table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  token: text('token').notNull().unique(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').default(false),
  usedAt: timestamp('used_at'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('password_reset_tokens_user_idx').on(table.userId),
  tokenIdx: uniqueIndex('password_reset_tokens_token_idx').on(table.token),
  tokenHashIdx: index('password_reset_tokens_token_hash_idx').on(table.tokenHash),
  expiresAtIdx: index('password_reset_tokens_expires_at_idx').on(table.expiresAt),
  isUsedIdx: index('password_reset_tokens_is_used_idx').on(table.isUsed),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: 'password_reset_tokens_user_fk' }),
}));

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  data: jsonb('data'),
  priority: varchar('priority', { length: 20 }).default('normal'),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  channel: varchar('channel', { length: 20 }).default('in_app'),
  actionUrl: text('action_url'),
  actionText: varchar('action_text', { length: 100 }),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
  typeIdx: index('notifications_type_idx').on(table.type),
  priorityIdx: index('notifications_priority_idx').on(table.priority),
  isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  channelIdx: index('notifications_channel_idx').on(table.channel),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: 'notifications_user_fk' }),
}));

// User favorites table
export const userFavorites = pgTable('user_favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  notes: text('notes'),
  tags: json('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('user_favorites_user_idx').on(table.userId),
  serviceIdx: index('user_favorites_service_idx').on(table.serviceId),
  userServiceIdx: uniqueIndex('user_favorites_user_service_idx').on(table.userId, table.serviceId),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: 'user_favorites_user_fk' }),
  serviceFk: foreignKey({ columns: [table.serviceId], foreignColumns: [services.id], name: 'user_favorites_service_fk' }),
}));

// Service categories table
export const serviceCategories = pgTable('service_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  image: text('image'),
  parentId: integer('parent_id'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  nameIdx: uniqueIndex('service_categories_name_idx').on(table.name),
  slugIdx: uniqueIndex('service_categories_slug_idx').on(table.slug),
  parentIdx: index('service_categories_parent_idx').on(table.parentId),
  isActiveIdx: index('service_categories_is_active_idx').on(table.isActive),
  sortOrderIdx: index('service_categories_sort_order_idx').on(table.sortOrder),
  parentFk: foreignKey({ columns: [table.parentId], foreignColumns: [table.id], name: 'service_categories_parent_fk' }),
}));

// Promotional codes/coupons table
export const promotionalCodes = pgTable('promotional_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull(),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  minimumAmount: decimal('minimum_amount', { precision: 10, scale: 2 }),
  maximumDiscount: decimal('maximum_discount', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('INR'),
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').default(0),
  userUsageLimit: integer('user_usage_limit').default(1),
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(false),
  applicableCategories: json('applicable_categories').$type<string[]>().default([]),
  applicableServices: json('applicable_services').$type<string[]>().default([]),
  excludedCategories: json('excluded_categories').$type<string[]>().default([]),
  excludedServices: json('excluded_services').$type<string[]>().default([]),
  validFrom: timestamp('valid_from').notNull(),
  validTo: timestamp('valid_to').notNull(),
  createdBy: uuid('created_by').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  codeIdx: uniqueIndex('promotional_codes_code_idx').on(table.code),
  typeIdx: index('promotional_codes_type_idx').on(table.type),
  isActiveIdx: index('promotional_codes_is_active_idx').on(table.isActive),
  validityIdx: index('promotional_codes_validity_idx').on(table.validFrom, table.validTo),
  createdByIdx: index('promotional_codes_created_by_idx').on(table.createdBy),
  createdByFk: foreignKey({ columns: [table.createdBy], foreignColumns: [users.id], name: 'promotional_codes_created_by_fk' }),
}));

// Promotional code usage table
export const promotionalCodeUsage = pgTable('promotional_code_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  promoCodeId: uuid('promo_code_id').notNull(),
  userId: uuid('user_id').notNull(),
  bookingId: uuid('booking_id'),
  transactionId: uuid('transaction_id'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
  originalAmount: decimal('original_amount', { precision: 10, scale: 2 }).notNull(),
  finalAmount: decimal('final_amount', { precision: 10, scale: 2 }).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  promoCodeIdx: index('promotional_code_usage_promo_code_idx').on(table.promoCodeId),
  userIdx: index('promotional_code_usage_user_idx').on(table.userId),
  bookingIdx: index('promotional_code_usage_booking_idx').on(table.bookingId),
  transactionIdx: index('promotional_code_usage_transaction_idx').on(table.transactionId),
  userPromoIdx: index('promotional_code_usage_user_promo_idx').on(table.userId, table.promoCodeId),
  promoCodeFk: foreignKey({ columns: [table.promoCodeId], foreignColumns: [promotionalCodes.id], name: 'promotional_code_usage_promo_code_fk' }),
  userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: 'promotional_code_usage_user_fk' }),
  bookingFk: foreignKey({ columns: [table.bookingId], foreignColumns: [serviceBookings.id], name: 'promotional_code_usage_booking_fk' }),
}));

// System settings table
export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  type: varchar('type', { length: 20 }).default('string'),
  category: varchar('category', { length: 50 }).default('general'),
  description: text('description'),
  isPublic: boolean('is_public').default(false),
  isEncrypted: boolean('is_encrypted').default(false),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  keyIdx: uniqueIndex('system_settings_key_idx').on(table.key),
  categoryIdx: index('system_settings_category_idx').on(table.category),
  typeIdx: index('system_settings_type_idx').on(table.type),
  isPublicIdx: index('system_settings_is_public_idx').on(table.isPublic),
  updatedByFk: foreignKey({ columns: [table.updatedBy], foreignColumns: [users.id], name: 'system_settings_updated_by_fk' }),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  services: many(services),
  serviceBookings: many(serviceBookings),
  transactions: many(transactions),
  conversionRequests: many(conversionRequests),
  paymentMethods: many(paymentMethods),
  paymentTransactions: many(paymentTransactions),
  serviceReviews: many(serviceReviews),
  auditLogs: many(auditLogs),
  apiKeys: many(apiKeys),
  passwordResetTokens: many(passwordResetTokens),
  notifications: many(notifications),
  userFavorites: many(userFavorites),
  promotionalCodes: many(promotionalCodes),
  promotionalCodeUsage: many(promotionalCodeUsage),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  organization: one(users, {
    fields: [services.organizationId],
    references: [users.id]
  }),
  approvedBy: one(users, {
    fields: [services.approvedBy],
    references: [users.id]
  }),
  lastModifiedBy: one(users, {
    fields: [services.lastModifiedBy],
    references: [users.id]
  }),
  bookings: many(serviceBookings),
  reviews: many(serviceReviews),
  favorites: many(userFavorites),
  transactions: many(transactions),
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

export const serviceBookingsRelations = relations(serviceBookings, ({ one, many }) => ({
  service: one(services, {
    fields: [serviceBookings.serviceId],
    references: [services.id]
  }),
  user: one(users, {
    fields: [serviceBookings.userId],
    references: [users.id]
  }),
  cancelledBy: one(users, {
    fields: [serviceBookings.cancelledBy],
    references: [users.id]
  }),
  paymentTransactions: many(paymentTransactions),
  reviews: many(serviceReviews),
  promotionalCodeUsage: many(promotionalCodeUsage),
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
  paymentMethod: one(paymentMethods, {
    fields: [paymentTransactions.paymentMethodId],
    references: [paymentMethods.id]
  }),
  booking: one(serviceBookings, {
    fields: [paymentTransactions.bookingId],
    references: [serviceBookings.id]
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
  booking: one(serviceBookings, {
    fields: [serviceReviews.bookingId],
    references: [serviceBookings.id]
  }),
  moderatedBy: one(users, {
    fields: [serviceReviews.moderatedBy],
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
  revokedBy: one(users, {
    fields: [apiKeys.revokedBy],
    references: [users.id]
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id]
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id]
  }),
  service: one(services, {
    fields: [userFavorites.serviceId],
    references: [services.id]
  }),
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ one, many }) => ({
  parent: one(serviceCategories, {
    fields: [serviceCategories.parentId],
    references: [serviceCategories.id]
  }),
  children: many(serviceCategories),
}));

export const promotionalCodesRelations = relations(promotionalCodes, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [promotionalCodes.createdBy],
    references: [users.id]
  }),
  usage: many(promotionalCodeUsage),
}));

export const promotionalCodeUsageRelations = relations(promotionalCodeUsage, ({ one }) => ({
  promoCode: one(promotionalCodes, {
    fields: [promotionalCodeUsage.promoCodeId],
    references: [promotionalCodes.id]
  }),
  user: one(users, {
    fields: [promotionalCodeUsage.userId],
    references: [users.id]
  }),
  booking: one(serviceBookings, {
    fields: [promotionalCodeUsage.bookingId],
    references: [serviceBookings.id]
  }),
}));

export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
  updatedBy: one(users, {
    fields: [systemSettings.updatedBy],
    references: [users.id]
  }),
}));

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type ServiceBooking = typeof serviceBookings.$inferSelect;
export type NewServiceBooking = typeof serviceBookings.$inferInsert;
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
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type NewServiceCategory = typeof serviceCategories.$inferInsert;
export type PromotionalCode = typeof promotionalCodes.$inferSelect;
export type NewPromotionalCode = typeof promotionalCodes.$inferInsert;
export type PromotionalCodeUsage = typeof promotionalCodeUsage.$inferSelect;
export type NewPromotionalCodeUsage = typeof promotionalCodeUsage.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;