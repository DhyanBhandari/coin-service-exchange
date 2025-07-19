// backend/src/app.ts - Modified for Vercel Deployment
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Initialize database after loading environment variables
import { initializeDatabase, testConnection } from './config/database';
import { testRazorpayConnection } from './config/razorpay';

import { logger } from './utils/logger';


// Initialize database connection
initializeDatabase();

// Import middleware
import { errorHandler, notFound } from './middleware/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import serviceRoutes from './routes/service.routes';
import paymentRoutes from './routes/payment.routes';
import conversionRoutes from './routes/conversion.routes';
import adminRoutes from './routes/admin.routes';

// Import utils
import { createApiResponse } from './utils/helpers';
import { API_PREFIX } from './utils/constants';

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enhanced CORS configuration for frontend integration
app.use(cors({
    origin: [
        'http://localhost:8080',  // Vite dev server
        'http://localhost:3000',  // React dev server  
        'http://localhost:5173',  // Alternative Vite port
        'http://localhost:4173',  // Vite preview
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

// Trust proxy for accurate IP addresses in production environments
app.set('trust proxy', 1);


// Root route handler
app.get('/', (_req, res) => {
    res.json(
        createApiResponse(true, {
            version: 'v1',
            status: 'operational',
            timestamp: new Date().toISOString(),
            documentation: '/api',
            health: '/health'
        }, 'ErthaExchange Backend API')
    );
});

// Health check endpoint with dependency status
app.get('/health', async (_req, res) => {
    logger.info('Health check requested');
    try {
        const [dbStatus, razorpayStatus] = await Promise.allSettled([
            testConnection(),
            testRazorpayConnection(),
          
        ]);

        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0',
            dependencies: {
                database: {
                    connected: dbStatus.status === 'fulfilled' && dbStatus.value,
                    status: dbStatus.status === 'fulfilled' && dbStatus.value ? 'Connected' : 'Connection Failed'
                },
                razorpay: {
                    connected: razorpayStatus.status === 'fulfilled' && razorpayStatus.value,
                    status: razorpayStatus.status === 'fulfilled' && razorpayStatus.value ? 'Connected' : 'Connection Failed'
                },
               
            }
        };

        if (healthStatus.dependencies.database.connected && healthStatus.dependencies.razorpay.connected ) {
            logger.info('Health check passed. All services connected.');
        } else {
            logger.warn('Health check completed with connection issues.', healthStatus.dependencies);
        }

        res.status(200).json(createApiResponse(true, healthStatus));

    } catch (error) {
        logger.error('Health check failed with an unexpected error:', error);
        res.status(503).json(createApiResponse(false, null, 'Service Unavailable'));
    }
});


// API documentation endpoint
app.get('/api', (_req, res) => {
    res.json(
        createApiResponse(true, {
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
app.use(`${API_PREFIX}/admin`, adminRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Vercel requires the app to be exported as a default module.
// The app.listen() block has been removed as Vercel handles the server lifecycle.
export default app;
