// Simple start script for Railway without path aliases
require('dotenv').config();

// Debug environment variables
console.log('=== Environment Variables Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('All env keys:', Object.keys(process.env).filter(key => !key.startsWith('npm_')).sort());
console.log('================================');

const app = require('./dist/src/app').default;

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(parseInt(PORT), HOST, () => {
    console.log(`Server is running on ${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not configured'}`);
});