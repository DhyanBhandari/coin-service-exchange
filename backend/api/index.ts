// api/index.ts - Vercel serverless function entry point
// Register path aliases for production
require('../register-paths');

import app from '../src/app';

// For Vercel serverless function
module.exports = app;