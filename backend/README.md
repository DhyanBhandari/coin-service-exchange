# ErthaExchange Backend Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database
3. **Supabase** account
4. **Razorpay** account (for payments)

## Step 1: Environment Setup

Create a `.env` file in your backend root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/erthaexchange

# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxx

# Payment Configuration
PAYMENT_CURRENCY=INR
MIN_PAYMENT_AMOUNT=10
MAX_PAYMENT_AMOUNT=1000000

# Logging
LOG_LEVEL=info

# Admin Configuration
ADMIN_EMAIL=admin@erthaexchange.com
ADMIN_PASSWORD=admin123
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Database Setup

### Option A: Using Supabase (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string and update your `DATABASE_URL`
5. Run migrations:

```bash
npx drizzle-kit push:pg
```

### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database called `erthaexchange`
3. Update your `DATABASE_URL` in `.env`
4. Run migrations:

```bash
npm run db:migrate
```

## Step 4: Run Database Migrations

```bash
# Generate migration files (if needed)
npm run db:generate

# Push schema to database
npm run db:migrate
```

## Step 5: Seed Database (Optional)

```bash
npm run seed
```

This will create sample data including:
- Admin user: `admin@erthaexchange.com` / `admin123`
- Organization user: `org@techsolutions.com` / `org123`
- Regular user: `john@example.com` / `user123`

## Step 6: Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Step 7: Test the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Register a User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!@#",
    "role": "user"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

## Common Issues and Solutions

### 1. Database Connection Error

**Error**: `Database connection failed`

**Solution**:
- Check your `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify database credentials
- Check if the database exists

### 2. JWT Secret Error

**Error**: `JWT_SECRET is not set`

**Solution**:
- Add `JWT_SECRET` to your `.env` file
- Make sure it's at least 32 characters long

### 3. TypeScript Path Resolution

**Error**: `Cannot find module '@/...'`

**Solution**:
- Ensure `tsconfig-paths` is installed
- Check `tsconfig.json` paths configuration
- Restart your development server

### 4. Drizzle Migration Issues

**Error**: `Migration failed`

**Solution**:
```bash
# Check database connection
npm run db:studio

# Generate fresh migrations
npm run db:generate

# Push to database
npm run db:migrate
```

## Available API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/password` - Update password
- `POST /api/v1/auth/logout` - User logout

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/wallet` - Get wallet balance

### Services
- `POST /api/v1/services` - Create service (Organizations)
- `GET /api/v1/services` - List services
- `GET /api/v1/services/:id` - Get service details
- `PUT /api/v1/services/:id` - Update service
- `DELETE /api/v1/services/:id` - Delete service

### Payments
- `POST /api/v1/payments/orders` - Create payment order
- `POST /api/v1/payments/verify` - Verify payment
- `POST /api/v1/payments/webhook` - Payment webhook

### Transactions
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/transactions/:id` - Get transaction details
- `GET /api/v1/transactions/stats` - Transaction statistics

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard statistics
- `GET /api/v1/admin/activity` - Recent activity
- `GET /api/v1/admin/health` - System health check

## Development Tips

1. **Use Drizzle Studio** for database management:
   ```bash
   npm run db:studio
   ```

2. **Check logs** for debugging:
   ```bash
   tail -f logs/combined.log
   ```

3. **Environment Variables**: Always restart the server after changing `.env`

4. **Database Schema Changes**:
   - Update `src/models/schema.ts`
   - Run `npm run db:generate`
   - Run `npm run db:migrate`

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
RAZORPAY_KEY_ID=your-production-razorpay-key
RAZORPAY_KEY_SECRET=your-production-razorpay-secret
```

### Build and Start

```bash
npm run build
npm start
```

## Troubleshooting

If you encounter any issues:

1. **Check the logs**: Look at the console output or log files
2. **Verify environment variables**: Ensure all required variables are set
3. **Database connectivity**: Test database connection manually
4. **Dependencies**: Run `npm install` to ensure all dependencies are installed
5. **TypeScript compilation**: Run `npm run build` to check for TypeScript errors

## Support

For issues or questions:
- Check the logs first
- Verify your environment configuration
- Ensure all dependencies are installed
- Test database connectivity

The backend is now ready for development! 🚀
