# ErthaExchange Backend

A comprehensive backend system for the ErthaExchange platform - a coin-based service marketplace where users can purchase coins, organizations can list services, and seamless transactions occur between parties.

## 🚀 Features

- **User Management**: Registration, authentication, profile management
- **Service Marketplace**: Organizations can list services, users can browse and book
- **Coin System**: Purchase coins, use for services, conversion back to currency
- **Payment Integration**: Razorpay integration for secure payments
- **Transaction Management**: Complete audit trail of all transactions
- **Admin Dashboard**: Comprehensive admin controls and analytics
- **Audit Logging**: Complete activity tracking for compliance
- **Rate Limiting**: Built-in API rate limiting for security
- **Real-time Notifications**: Event-driven notification system

## 🛠 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens
- **Payments**: Razorpay integration
- **Storage**: Supabase integration
- **Validation**: Joi schemas
- **Logging**: Winston logger
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- PostgreSQL database
- Supabase account
- Razorpay account (for payments)

## 🚦 Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxx

# Admin
ADMIN_EMAIL=admin@erthaexchange.com
ADMIN_PASSWORD=admin123
```

### 3. Database Setup

```bash
# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run seed
```

### 4. Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database, Supabase, Razorpay configs
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth, validation, error middleware
│   ├── models/          # Drizzle schema definitions
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper functions and constants
│   └── app.ts           # Main application file
├── migrations/          # Database migration files
└── scripts/             # Utility scripts
```

## 🔑 API Endpoints

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
- `GET /api/v1/services` - List services with filters
- `GET /api/v1/services/:id` - Get service details
- `PUT /api/v1/services/:id` - Update service
- `DELETE /api/v1/services/:id` - Delete service
- `POST /api/v1/services/:id/book` - Book service
- `POST /api/v1/services/:id/reviews` - Add review

### Payments
- `POST /api/v1/payments/orders` - Create payment order
- `POST /api/v1/payments/verify` - Verify payment
- `POST /api/v1/payments/webhook` - Payment webhook
- `POST /api/v1/payments/refund` - Process refund (Admin)

### Conversions
- `POST /api/v1/conversions` - Request coin conversion
- `GET /api/v1/conversions` - List conversion requests
- `GET /api/v1/conversions/:id` - Get conversion details
- `POST /api/v1/conversions/:id/approve` - Approve conversion (Admin)
- `POST /api/v1/conversions/:id/reject` - Reject conversion (Admin)

### Transactions
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/transactions/:id` - Get transaction details
- `GET /api/v1/transactions/stats` - Transaction statistics
- `GET /api/v1/transactions/history` - User transaction history

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard statistics
- `GET /api/v1/admin/activity` - Recent activity
- `GET /api/v1/admin/health` - System health check
- `POST /api/v1/admin/services/:id/approve` - Approve service
- `POST /api/v1/admin/users/:id/suspend` - Suspend user
- `POST /api/v1/admin/users/:id/reactivate` - Reactivate user
- `GET /api/v1/admin/audit-logs` - Audit logs

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: User, Organization, Admin roles
- **Rate Limiting**: Configurable rate limits per endpoint
- **Input Validation**: Comprehensive Joi validation schemas
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM
- **CORS Protection**: Configurable CORS policies
- **Helmet Security**: Security headers and protection
- **Audit Logging**: Complete activity tracking

## 💳 Payment Flow

1. **Create Order**: Frontend requests payment order creation
2. **Process Payment**: User completes payment via Razorpay
3. **Verify Payment**: Backend verifies payment signature
4. **Update Balance**: User's coin balance is updated
5. **Audit Trail**: Transaction is logged for compliance

## 🔄 Conversion Flow

1. **Request Conversion**: Organization requests coin-to-currency conversion
2. **Admin Review**: Admin reviews and approves/rejects request
3. **Process Transfer**: Bank transfer is initiated (external process)
4. **Update Balance**: Organization's coin balance is debited
5. **Completion**: Conversion is marked as completed

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📊 Monitoring & Logging

- **Winston Logging**: Structured logging with multiple transports
- **Health Endpoints**: Built-in health check endpoints
- **Error Tracking**: Comprehensive error handling and reporting
- **Audit Trails**: Complete activity logging for compliance

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
RAZORPAY_KEY_ID=your-production-razorpay-key
RAZORPAY_KEY_SECRET=your-production-razorpay-secret
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact:
- Email: support@erthaexchange.com
- Documentation: [API Documentation](https://docs.erthaexchange.com)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 🔄 Changelog

### v1.0.0
- Initial release with core functionality
- User management and authentication
- Service marketplace
- Payment integration
- Admin dashboard
- Audit logging
