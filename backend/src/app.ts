// backend/src/app.ts - Updated CORS configuration
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Initialize database after loading environment variables
import { initializeDatabase, testConnection } from './config/database';
import { testSupabaseConnection } from './config/supabase';
import { testRazorpayConnection } from './config/razorpay';

// Initialize database connection
initializeDatabase();

// Import middleware
import { errorHandler, notFound, asyncHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import serviceRoutes from './routes/service.routes';
import paymentRoutes from './routes/payment.routes';
import conversionRoutes from './routes/conversion.routes';
import transactionRoutes from './routes/transaction.routes';
import adminRoutes from './routes/admin.routes';

// Import utils
import { logger } from './utils/logger';
import { createApiResponse } from './utils/helpers';
import { API_PREFIX } from './utils/constants';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enhanced CORS configuration for frontend integration
app.use(cors({
    origin: [
        'https://coin-service-exchange-frontend.bolt.run',
        'http://localhost:8080',  // Vite dev server
        'http://localhost:3000',  // React dev server
        'http://localhost:5173',  // Alternative Vite port
        process.env.FRONTEND_URL || 'http://localhost:8080'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Handle preflight requests
app.options('*', cors());

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
    // Beautiful startup banner
    console.log('\n' + '='.repeat(80));
    console.log('🚀 ERTHAEXCHANGE BACKEND SERVER STARTING...');
    console.log('='.repeat(80));
    
    logger.info(`🌐 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
    console.log(`💻 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    console.log('\n📋 TESTING SERVICE CONNECTIONS...');
    console.log('-'.repeat(50));

    // Test connections with enhanced logging
    try {
        const dbConnected = await testConnection();
        const supabaseConnected = await testSupabaseConnection();
        const razorpayConnected = await testRazorpayConnection();

        // Database status
        if (dbConnected) {
            console.log('✅ Database (PostgreSQL)    | Connected & Ready');
        } else {
            console.log('❌ Database (PostgreSQL)    | Connection Failed');
        }

        // Supabase status
        if (supabaseConnected) {
            console.log('✅ Supabase Storage         | Connected & Ready');
        } else {
            console.log('❌ Supabase Storage         | Connection Failed');
        }

        // Razorpay status
        if (razorpayConnected) {
            console.log('✅ Razorpay Payment         | Connected & Ready');
        } else {
            console.log('❌ Razorpay Payment         | Connection Failed');
        }

        console.log('-'.repeat(50));

        // Overall status
        if (dbConnected && supabaseConnected && razorpayConnected) {
            console.log('🎉 ALL SERVICES CONNECTED SUCCESSFULLY!');
            console.log('🔥 Backend is ready to handle requests!');
            console.log('\n📚 Available API Endpoints:');
            console.log(`   👤 Authentication: ${API_PREFIX}/auth`);
            console.log(`   👥 Users:          ${API_PREFIX}/users`);
            console.log(`   🛍️  Services:       ${API_PREFIX}/services`);
            console.log(`   💳 Payments:       ${API_PREFIX}/payments`);
            console.log(`   🔄 Conversions:    ${API_PREFIX}/conversions`);
            console.log(`   📊 Transactions:   ${API_PREFIX}/transactions`);
            console.log(`   🔧 Admin:          ${API_PREFIX}/admin`);
            console.log(`   ❤️  Health Check:   /health`);
            
            console.log('\n🎯 QUICK START GUIDE:');
            console.log('   1. Register a user: POST /api/v1/auth/register');
            console.log('   2. Login: POST /api/v1/auth/login');
            console.log('   3. Get profile: GET /api/v1/auth/profile');
            console.log('   4. Check health: GET /health');
            
            logger.info('🚀 ErthaExchange Backend Server is fully operational!');
        } else {
            console.log('⚠️  SOME SERVICES FAILED TO CONNECT');
            console.log('🔧 Please check your configuration:');
            if (!dbConnected) console.log('   - Check DATABASE_URL in .env file');
            if (!supabaseConnected) console.log('   - Check SUPABASE_URL and keys in .env file');
            if (!razorpayConnected) console.log('   - Check RAZORPAY credentials in .env file');
            
            logger.warn('⚠️  Server started but some services are unavailable');
        }
    } catch (error) {
        console.log('❌ CRITICAL ERROR DURING STARTUP');
        logger.error('Failed to test connections:', error);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎊 ERTHAEXCHANGE BACKEND SERVER READY!');
    console.log('='.repeat(80) + '\n');
});

export default app;