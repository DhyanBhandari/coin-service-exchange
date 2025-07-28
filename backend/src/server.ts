import app from './app';

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Bind to all interfaces for Railway

app.listen(parseInt(PORT as string), HOST, () => {
    console.log(`Server is running on ${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database URL: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});