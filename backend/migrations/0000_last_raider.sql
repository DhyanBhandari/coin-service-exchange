CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"key" text NOT NULL,
	"key_hash" text NOT NULL,
	"permissions" json DEFAULT '[]'::json,
	"scopes" json DEFAULT '[]'::json,
	"rate_limit" integer DEFAULT 1000,
	"usage_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"environment" varchar(20) DEFAULT 'production',
	"allowed_ips" json DEFAULT '[]'::json,
	"allowed_domains" json DEFAULT '[]'::json,
	"last_used_at" timestamp,
	"last_used_ip" text,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"revoked_by" uuid,
	"revocation_reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" text,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"method" varchar(10),
	"endpoint" text,
	"status_code" integer,
	"duration" integer,
	"old_values" jsonb,
	"new_values" jsonb,
	"changes" jsonb,
	"ip_address" text,
	"user_agent" text,
	"location" jsonb,
	"device_info" jsonb,
	"severity" varchar(20) DEFAULT 'info',
	"category" varchar(50),
	"tags" json DEFAULT '[]'::json,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversion_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'INR',
	"exchange_rate" numeric(10, 4),
	"converted_amount" numeric(12, 2),
	"status" text DEFAULT 'pending',
	"priority" text DEFAULT 'normal',
	"reason" text,
	"admin_notes" text,
	"processed_by" uuid,
	"processed_at" timestamp,
	"bank_details" jsonb,
	"transaction_id" text,
	"payment_reference" text,
	"fees" numeric(12, 2) DEFAULT '0.00',
	"taxes" numeric(12, 2) DEFAULT '0.00',
	"expected_processing_time" text,
	"actual_processing_time" interval,
	"attachments" json DEFAULT '[]'::json,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"priority" varchar(20) DEFAULT 'normal',
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"channel" varchar(20) DEFAULT 'in_app',
	"action_url" text,
	"action_text" varchar(100),
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false,
	"used_at" timestamp,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"nickname" varchar(100),
	"details" jsonb,
	"security_info" jsonb,
	"is_active" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"verified_at" timestamp,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_id" uuid,
	"payment_method_id" uuid,
	"booking_id" uuid,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'INR',
	"status" text DEFAULT 'pending',
	"payment_method" text NOT NULL,
	"provider" text,
	"gateway" text DEFAULT 'razorpay',
	"gateway_order_id" text,
	"gateway_payment_id" text,
	"gateway_response" jsonb,
	"gateway_fee" numeric(12, 2) DEFAULT '0.00',
	"platform_fee" numeric(12, 2) DEFAULT '0.00',
	"taxes" numeric(12, 2) DEFAULT '0.00',
	"net_amount" numeric(12, 2),
	"failure_reason" text,
	"failure_code" text,
	"retry_count" integer DEFAULT 0,
	"refund_id" text,
	"refund_amount" numeric(12, 2),
	"refund_status" text,
	"refund_reason" text,
	"refunded_at" timestamp,
	"captured_at" timestamp,
	"settled_at" timestamp,
	"metadata" jsonb,
	"webhook_data" jsonb,
	"ip_address" text,
	"user_agent" text,
	"device_fingerprint" text,
	"risk_score" numeric(5, 2),
	"fraud_flags" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promotional_code_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promo_code_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"booking_id" uuid,
	"transaction_id" uuid,
	"discount_amount" numeric(10, 2) NOT NULL,
	"original_amount" numeric(10, 2) NOT NULL,
	"final_amount" numeric(10, 2) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promotional_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"type" varchar(20) NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"minimum_amount" numeric(10, 2),
	"maximum_discount" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'INR',
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"user_usage_limit" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"applicable_categories" json DEFAULT '[]'::json,
	"applicable_services" json DEFAULT '[]'::json,
	"excluded_categories" json DEFAULT '[]'::json,
	"excluded_services" json DEFAULT '[]'::json,
	"valid_from" timestamp NOT NULL,
	"valid_to" timestamp NOT NULL,
	"created_by" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "promotional_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"booking_reference" varchar(50),
	"quantity" integer DEFAULT 1,
	"total_amount" numeric(12, 2) NOT NULL,
	"original_amount" numeric(12, 2),
	"discount_amount" numeric(12, 2) DEFAULT '0.00',
	"tax_amount" numeric(12, 2) DEFAULT '0.00',
	"processing_fee" numeric(12, 2) DEFAULT '0.00',
	"currency" varchar(3) DEFAULT 'INR',
	"status" text DEFAULT 'pending',
	"payment_status" text DEFAULT 'pending',
	"booking_date" timestamp,
	"service_date" timestamp,
	"checkin_date" timestamp,
	"checkout_date" timestamp,
	"guest_details" jsonb,
	"special_requests" text,
	"notes" text,
	"contact_info" jsonb,
	"cancellation_reason" text,
	"cancelled_at" timestamp,
	"cancelled_by" uuid,
	"refund_amount" numeric(12, 2),
	"refund_reason" text,
	"refunded_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "service_bookings_booking_reference_unique" UNIQUE("booking_reference")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(100),
	"image" text,
	"parent_id" integer,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "service_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "service_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"booking_id" uuid,
	"rating" integer NOT NULL,
	"title" varchar(200),
	"review" text,
	"pros" json DEFAULT '[]'::json,
	"cons" json DEFAULT '[]'::json,
	"images" json DEFAULT '[]'::json,
	"videos" json DEFAULT '[]'::json,
	"tags" json DEFAULT '[]'::json,
	"is_anonymous" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"is_visible" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"helpful_votes" integer DEFAULT 0,
	"report_count" integer DEFAULT 0,
	"moderated_by" uuid,
	"moderated_at" timestamp,
	"moderation_notes" text,
	"response_from_org" text,
	"responded_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"short_description" text,
	"category" text NOT NULL,
	"sub_category" text,
	"price" numeric(10, 2) NOT NULL,
	"original_price" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'INR',
	"location" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100) DEFAULT 'India',
	"coordinates" jsonb,
	"duration" varchar(100),
	"capacity" integer,
	"min_bookings" integer DEFAULT 1,
	"max_bookings" integer,
	"available_slots" integer,
	"tags" json DEFAULT '[]'::json,
	"features" json DEFAULT '[]'::json,
	"inclusions" json DEFAULT '[]'::json,
	"exclusions" json DEFAULT '[]'::json,
	"images" json DEFAULT '[]'::json,
	"videos" json DEFAULT '[]'::json,
	"documents" json DEFAULT '[]'::json,
	"rating" numeric(3, 2) DEFAULT '0.00',
	"review_count" integer DEFAULT 0,
	"booking_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"favorite_count" integer DEFAULT 0,
	"status" text DEFAULT 'pending',
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"is_promoted" boolean DEFAULT false,
	"available_from" timestamp,
	"available_to" timestamp,
	"availability_schedule" jsonb,
	"max_bookings_per_user" integer DEFAULT 1,
	"cancellation_policy" text,
	"refund_policy" text,
	"terms_and_conditions" text,
	"requirements" text,
	"age_restriction" integer,
	"skill_level" varchar(50),
	"language" varchar(50) DEFAULT 'English',
	"contact_info" jsonb,
	"metadata" jsonb,
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" json DEFAULT '[]'::json,
	"admin_notes" text,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"last_modified_by" uuid,
	"published_at" timestamp,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"type" varchar(20) DEFAULT 'string',
	"category" varchar(50) DEFAULT 'general',
	"description" text,
	"is_public" boolean DEFAULT false,
	"is_encrypted" boolean DEFAULT false,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_id" uuid,
	"booking_id" uuid,
	"type" text NOT NULL,
	"sub_type" text,
	"amount" numeric(12, 2) NOT NULL,
	"coin_amount" numeric(12, 2),
	"fiat_amount" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'INR',
	"exchange_rate" numeric(10, 4),
	"description" text NOT NULL,
	"status" text DEFAULT 'pending',
	"reference_id" varchar(100),
	"reference_type" varchar(50),
	"payment_id" text,
	"payment_method" text,
	"payment_provider" text,
	"balance_before" numeric(12, 2),
	"balance_after" numeric(12, 2),
	"fees" numeric(12, 2) DEFAULT '0.00',
	"taxes" numeric(12, 2) DEFAULT '0.00',
	"processed_at" timestamp,
	"processed_by" uuid,
	"failure_reason" text,
	"retry_count" integer DEFAULT 0,
	"metadata" jsonb,
	"tags" json DEFAULT '[]'::json,
	"is_reversible" boolean DEFAULT true,
	"reversed_transaction_id" uuid,
	"parent_transaction_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"notes" text,
	"tags" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" varchar(128),
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"name" varchar(100) NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"wallet_balance" numeric(10, 2) DEFAULT '0.00',
	"email_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"phone" varchar(20),
	"address" text,
	"profile_image" text,
	"date_of_birth" timestamp,
	"preferences" jsonb,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_user_idx" ON "api_keys" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_idx" ON "api_keys" ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_key_hash_idx" ON "api_keys" ("key_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_is_active_idx" ON "api_keys" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_environment_idx" ON "api_keys" ("environment");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_user_idx" ON "audit_logs" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_resource_idx" ON "audit_logs" ("resource");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_category_idx" ON "audit_logs" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_severity_idx" ON "audit_logs" ("severity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_ip_address_idx" ON "audit_logs" ("ip_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversion_requests_organization_idx" ON "conversion_requests" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversion_requests_status_idx" ON "conversion_requests" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversion_requests_priority_idx" ON "conversion_requests" ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversion_requests_created_at_idx" ON "conversion_requests" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_priority_idx" ON "notifications" ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" ("is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_channel_idx" ON "notifications" ("channel");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_idx" ON "password_reset_tokens" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_idx" ON "password_reset_tokens" ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_hash_idx" ON "password_reset_tokens" ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_at_idx" ON "password_reset_tokens" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_reset_tokens_is_used_idx" ON "password_reset_tokens" ("is_used");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_methods_user_idx" ON "payment_methods" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_methods_type_idx" ON "payment_methods" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_methods_provider_idx" ON "payment_methods" ("provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_methods_is_active_idx" ON "payment_methods" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_transactions_user_idx" ON "payment_transactions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_transactions_transaction_idx" ON "payment_transactions" ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_transactions_booking_idx" ON "payment_transactions" ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_transactions_razorpay_order_idx" ON "payment_transactions" ("razorpay_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_transactions_razorpay_payment_idx" ON "payment_transactions" ("razorpay_payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_transactions_status_idx" ON "payment_transactions" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_transactions_gateway_idx" ON "payment_transactions" ("gateway");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_transactions_created_at_idx" ON "payment_transactions" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotional_code_usage_promo_code_idx" ON "promotional_code_usage" ("promo_code_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotional_code_usage_user_idx" ON "promotional_code_usage" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotional_code_usage_booking_idx" ON "promotional_code_usage" ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotional_code_usage_transaction_idx" ON "promotional_code_usage" ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotional_code_usage_user_promo_idx" ON "promotional_code_usage" ("user_id","promo_code_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "promotional_codes_code_idx" ON "promotional_codes" ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotional_codes_type_idx" ON "promotional_codes" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotional_codes_is_active_idx" ON "promotional_codes" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotional_codes_validity_idx" ON "promotional_codes" ("valid_from","valid_to");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotional_codes_created_by_idx" ON "promotional_codes" ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_bookings_service_idx" ON "service_bookings" ("service_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_bookings_user_idx" ON "service_bookings" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_bookings_status_idx" ON "service_bookings" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_bookings_payment_status_idx" ON "service_bookings" ("payment_status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "service_bookings_ref_idx" ON "service_bookings" ("booking_reference");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_bookings_service_date_idx" ON "service_bookings" ("service_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_bookings_created_at_idx" ON "service_bookings" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "service_categories_name_idx" ON "service_categories" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "service_categories_slug_idx" ON "service_categories" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_categories_parent_idx" ON "service_categories" ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_categories_is_active_idx" ON "service_categories" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_categories_sort_order_idx" ON "service_categories" ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_reviews_service_idx" ON "service_reviews" ("service_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_reviews_user_idx" ON "service_reviews" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_reviews_booking_idx" ON "service_reviews" ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_reviews_rating_idx" ON "service_reviews" ("rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_reviews_is_visible_idx" ON "service_reviews" ("is_visible");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_reviews_is_featured_idx" ON "service_reviews" ("is_featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_reviews_created_at_idx" ON "service_reviews" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_organization_idx" ON "services" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_category_idx" ON "services" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_sub_category_idx" ON "services" ("sub_category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_status_idx" ON "services" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_price_idx" ON "services" ("price");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_location_idx" ON "services" ("location");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_city_idx" ON "services" ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_is_active_idx" ON "services" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_is_featured_idx" ON "services" ("is_featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_rating_idx" ON "services" ("rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_created_at_idx" ON "services" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_availability_idx" ON "services" ("available_from","available_to");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "system_settings_key_idx" ON "system_settings" ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_settings_category_idx" ON "system_settings" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_settings_type_idx" ON "system_settings" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_settings_is_public_idx" ON "system_settings" ("is_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_user_idx" ON "transactions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_service_idx" ON "transactions" ("service_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_booking_idx" ON "transactions" ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_type_idx" ON "transactions" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_status_idx" ON "transactions" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_reference_idx" ON "transactions" ("reference_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_payment_idx" ON "transactions" ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_created_at_idx" ON "transactions" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_favorites_user_idx" ON "user_favorites" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_favorites_service_idx" ON "user_favorites" ("service_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_favorites_user_service_idx" ON "user_favorites" ("user_id","service_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_revoked_by_fk" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversion_requests" ADD CONSTRAINT "conversion_requests_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversion_requests" ADD CONSTRAINT "conversion_requests_processed_by_fk" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_transaction_fk" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_method_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_booking_fk" FOREIGN KEY ("booking_id") REFERENCES "service_bookings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotional_code_usage" ADD CONSTRAINT "promotional_code_usage_promo_code_fk" FOREIGN KEY ("promo_code_id") REFERENCES "promotional_codes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotional_code_usage" ADD CONSTRAINT "promotional_code_usage_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotional_code_usage" ADD CONSTRAINT "promotional_code_usage_booking_fk" FOREIGN KEY ("booking_id") REFERENCES "service_bookings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotional_code_usage" ADD CONSTRAINT "promotional_code_usage_transaction_fk" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promotional_codes" ADD CONSTRAINT "promotional_codes_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_service_fk" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_cancelled_by_fk" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "service_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_service_fk" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_booking_fk" FOREIGN KEY ("booking_id") REFERENCES "service_bookings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_moderated_by_fk" FOREIGN KEY ("moderated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "services" ADD CONSTRAINT "services_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "services" ADD CONSTRAINT "services_approved_by_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "services" ADD CONSTRAINT "services_last_modified_by_fk" FOREIGN KEY ("last_modified_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_service_fk" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_booking_fk" FOREIGN KEY ("booking_id") REFERENCES "service_bookings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_processed_by_fk" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_service_fk" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
