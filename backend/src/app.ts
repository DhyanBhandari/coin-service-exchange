// backend/src/app.ts - Safe version with error handling
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

const app = express();

// Basic middleware first
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: '*', // Allow all origins for now
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Simple response helper
const createSimpleResponse = (success: boolean, data: any = null, message: string = '') => {
    return {
        success,
        data,
        message,
        timestamp: new Date().toISOString()
    };
};

// Basic root route
app.get('/', (_req, res) => {
    try {
        res.json(createSimpleResponse(true, {
            version: 'v1',
            status: 'operational',
            environment: process.env.NODE_ENV || 'development'
        }, 'ErthaExchange Backend API'));
    } catch (error) {
        res.status(500).json(createSimpleResponse(false, null, 'Server error'));
    }
});

// Health check without external dependencies
app.get('/health', (_req, res) => {
    try {
        res.json(createSimpleResponse(true, {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            memory: process.memoryUsage()
        }, 'Health check passed'));
    } catch (error) {
        res.status(500).json(createSimpleResponse(false, null, 'Health check failed'));
    }
});

// Test database connection endpoint
app.get('/test-db', async (_req, res) => {
    try {
        // Only test if DATABASE_URL exists
        if (!process.env.DATABASE_URL) {
            return res.json(createSimpleResponse(false, null, 'DATABASE_URL not configured'));
        }

        // Try to import and test database
        const { testConnection } = await import('./config/database');
        const dbStatus = await testConnection();

        res.json(createSimpleResponse(true, { connected: dbStatus }, 'Database test completed'));
    } catch (error: any) {
        res.json(createSimpleResponse(false, { error: error.message }, 'Database test failed'));
    }
});

// API info endpoint
app.get('/api', (_req, res) => {
    try {
        res.json(createSimpleResponse(true, {
            version: 'v1',
            endpoints: {
                health: '/health',
                'test-db': '/test-db',
                auth: '/api/v1/auth',
                users: '/api/v1/users',
                services: '/api/v1/services'
            }
        }, 'API Documentation'));
    } catch (error) {
        res.status(500).json(createSimpleResponse(false, null, 'API info error'));
    }
});

// Initialize routes safely
try {
    // Only load routes if essential dependencies are available
    if (process.env.DATABASE_URL) {
        // Import routes asynchronously to avoid crashes during startup
        Promise.all([
            import('./routes/auth.routes'),
            import('./routes/user.routes'),
            import('./routes/service.routes'),
            import('./routes/payment.routes'),
            import('./routes/conversion.routes'),
            import('./routes/admin.routes')
        ]).then(([authRoutes, userRoutes, serviceRoutes, paymentRoutes, conversionRoutes, adminRoutes]) => {
            app.use('/api/v1/auth', authRoutes.default);
            app.use('/api/v1/users', userRoutes.default);
            app.use('/api/v1/services', serviceRoutes.default);
            app.use('/api/v1/payments', paymentRoutes.default);
            app.use('/api/v1/conversions', conversionRoutes.default);
            app.use('/api/v1/admin', adminRoutes.default);

            console.log('Routes loaded successfully');
        }).catch((error) => {
            console.error('Failed to load routes:', error);
        });
    } else {
        console.warn('DATABASE_URL not configured - routes not loaded');
    }
} catch (error) {
    console.error('Error during route initialization:', error);
}

// 404 handler
app.use((_req, res) => {
    res.status(404).json(createSimpleResponse(false, null, 'Route not found'));
});

// Error handler
app.use((error: any, _req: any, res: any, _next: any) => {
    console.error('Global error:', error);
    res.status(500).json(createSimpleResponse(false, null, 'Internal server error'));
});

export default app;