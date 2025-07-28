// Render start script with better error handling
console.log('Starting Render backend...');

// Load environment variables
require('dotenv').config();

// Show basic environment info
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 5000);

try {
    // Try to load the app
    const app = require('./dist/src/app').default;
    
    const PORT = process.env.PORT || 5000;
    const HOST = '0.0.0.0';
    
    // Check for critical environment variables
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.warn('WARNING: Missing required environment variables:', missingVars);
        console.warn('The app will start but some features may not work properly.');
    }
    
    // Start the server
    const server = app.listen(parseInt(PORT), HOST, () => {
        console.log(`Server is running on ${HOST}:${PORT}`);
        console.log('Routes will load if DATABASE_URL is configured');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
    
} catch (error) {
    console.error('Failed to start server:', error);
    console.error('Make sure to run "npm run build" first');
    process.exit(1);
}