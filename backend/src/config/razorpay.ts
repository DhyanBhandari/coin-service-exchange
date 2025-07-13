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

        // Try to create a test order to verify credentials with timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Razorpay connection timeout')), 10000)
        );
        
        const orderPromise = razorpay.orders.create({
            amount: 100, // ₹1 (minimum amount for testing)
            currency: 'INR',
            receipt: 'test_receipt_' + Date.now(),
        });
        
        const testOrder = await Promise.race([orderPromise, timeoutPromise]);
        
        if (testOrder && testOrder.id) {
            logger.info('Razorpay connected successfully');
            return true;
        }
        
        logger.error('Razorpay connection failed: Test order ID not received.');
        return false;

    } catch (error) {
        // Handle specific error cases
        if (error instanceof Error) {
            if (error.message.includes('timeout')) {
                logger.warn('Razorpay connection timeout - continuing with limited functionality');
            } else {
                logger.error('Razorpay connection failed:', error.message);
            }
        } else {
            logger.error('Razorpay connection failed with unknown error');
        }
        return false;
    }
};
