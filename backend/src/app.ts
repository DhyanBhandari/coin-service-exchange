import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv'; // Import dotenv

// Load environment variables FIRST. This must be at the very top.
dotenv.config();

// Now that environment variables are loaded, import and initialize database.
// The initializeDatabase function will now safely access process.env.DATABASE_URL.
import { testConnection } from '@/config/database';
import { testSupabaseConnection } from '@/config/supabase';
import { testRazorpayConnection } from '@/config/razorpay';

// Call the database initialization function right after loading env variables.
// This ensures the database client and drizzle instance are ready.
// initializeDatabase(); // Removed because it does not exist in the module

// Import middleware
import { errorHandler, notFound } from '@/middleware/error.middleware';

// Import routes
import authRoutes from '@/routes/auth.routes';
import userRoutes from '@/routes/user.routes';
import serviceRoutes from '@/routes/service.routes';
import paymentRoutes from '@/routes/payment.routes';
import conversionRoutes from '@/routes/conversion.routes';
import transactionRoutes from '@/routes/transaction.routes';
import adminRoutes from '@/routes/admin.routes';

// Import utils
import { logger } from '@/utils/logger';
import { createApiResponse } from '@/utils/helpers';
import { API_PREFIX } from '@/utils/constants';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Health check endpoint
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

// API documentation endpoint
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

// API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/services`, serviceRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/conversions`, conversionRoutes);
app.use(`${API_PREFIX}/transactions`, transactionRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
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

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start server
const server = app.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);

    // Test connections
    try {
        // testConnection now uses the initialized client
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
