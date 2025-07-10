import Razorpay from 'razorpay';
import { logger } from '@/utils/logger';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
    logger.warn('Razorpay credentials not provided. Payment functionality will be limited.');
}

export const razorpay = new Razorpay({
    key_id: razorpayKeyId || 'rzp_test_demo', // Fallback for testing
    key_secret: razorpayKeySecret || 'demo_secret_key', // Fallback for testing
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
            return true; // Explicitly return true for demo mode
        }

        // Try to create a test order to verify credentials
        // Note: This actual API call will only succeed if real, valid keys are provided.
        // For local testing without real keys, the 'demo mode' path above will be taken.
        const testOrder = await razorpay.orders.create({
            amount: 100, // ₹1 (minimum amount for testing)
            currency: 'INR',
            receipt: 'test_receipt_' + Date.now(),
        });

        if (testOrder.id) {
            logger.info('Razorpay connected successfully');
            return true; // Explicitly return true on success
        }
        // If testOrder.id is not present but no error was thrown,
        // it implies an unexpected response, so we should treat it as a failure.
        logger.error('Razorpay connection failed: Test order ID not received.');
        return false;

    } catch (error) {
        logger.error('Razorpay connection failed:', error);
        return false; // Explicitly return false on error to cover all code paths
    }
};
