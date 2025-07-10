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
