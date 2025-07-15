-- Migration to add Firebase authentication support
-- Run this after your existing database setup

-- Add Firebase UID column to users table
ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128) UNIQUE;

-- Create index for Firebase UID
CREATE INDEX users_firebase_uid_idx ON users(firebase_uid);

-- Make password_hash optional (for Firebase users)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Update email_verified default
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT false;

-- Add any existing users with a default Firebase UID of NULL
-- (they will continue using traditional authentication)

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at on all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversion_requests_updated_at BEFORE UPDATE ON conversion_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_reviews_updated_at BEFORE UPDATE ON service_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON service_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- Admin user (you can create this via Firebase console and then update the record)
-- INSERT INTO users (firebase_uid, email, name, role, email_verified, is_active, wallet_balance)
-- VALUES (
--     'firebase_admin_uid_here', 
--     'admin@erthaexchange.com', 
--     'System Administrator', 
--     'admin', 
--     true, 
--     true, 
--     0.00
-- );

-- Grant necessary permissions (adjust based on your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;