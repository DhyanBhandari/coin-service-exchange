// Simple start script for Railway without path aliases
require('dotenv').config();
const app = require('./dist/src/app').default;

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(parseInt(PORT), HOST, () => {
    console.log(`Server is running on ${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not configured'}`);
});