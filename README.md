



ErthaExchange - Complete Codebase Documentation
Project Overview
ErthaExchange is a full-stack digital marketplace platform where users can purchase "ErthaCoins" and use them to buy services from organizations. The platform supports three user roles: Users (buy services), Organizations (offer services), and Admins (manage platform).
Technology Stack
Frontend

Framework: React 18 with TypeScript
Build Tool: Vite
UI Library: shadcn/ui components
Styling: Tailwind CSS
State Management: React hooks + localStorage
HTTP Client: Fetch API with custom service layer
Payment: Razorpay integration
Routing: React Router v6

Backend

Runtime: Node.js with Express.js
Language: TypeScript
Database: PostgreSQL
ORM: Drizzle ORM
Authentication: JWT tokens
Payment Gateway: Razorpay
File Storage: Supabase
Logging: Winston
Validation: Joi

Project Structure
├── src/                     # Frontend React application
├── backend/                 # Backend Node.js application
├── package.json            # Frontend dependencies
├── backend/package.json    # Backend dependencies
└── README.md
Frontend Architecture (src/)
Core Structure
src/
├── components/             # Reusable UI components
├── pages/                 # Route components
│   ├── user/             # User role pages
│   ├── org/              # Organization role pages
│   ├── admin/            # Admin role pages
│   └── services/         # Service detail pages
├── lib/                  # Utilities and services
├── hooks/                # Custom React hooks
└── main.tsx             # Application entry point
Key Components
Navigation & Layout

Navigation.tsx: Main navigation bar with user profile integration
UserProfilePanel.tsx: Sliding panel with user info, wallet balance, and quick actions
Footer.tsx: Site footer with links

Core Features

TopUpCoinsModal.tsx: Modal for adding coins to wallet
EnhancedPaymentModal.tsx: Advanced payment processing with Razorpay
ApiTestComponent.tsx: Development tool for testing API connectivity

Landing Page Sections

HeroSection.tsx: Main landing hero
FeaturesSection.tsx: Platform features showcase
ServicesSection.tsx: Featured services grid
CTASection.tsx: Call-to-action section

Pages by User Role
User Pages (pages/user/)

Dashboard.tsx: User dashboard with wallet, quick actions, recent transactions
BrowseServices.tsx: Service marketplace with search/filter
AddCoins.tsx: Coin purchase interface
Transactions.tsx: Transaction history with filtering

Organization Pages (pages/org/)

Dashboard.tsx: Org dashboard with earnings, services, conversions
Services.tsx: Manage services (CRUD operations)
Convert.tsx: Convert earned coins to fiat currency

Admin Pages (pages/admin/)

Dashboard.tsx: Platform overview with stats and recent activity
Users.tsx: User management (view, suspend, role changes)
Services.tsx: Service approval and management
Conversions.tsx: Approve/reject conversion requests

Service Detail Pages (pages/services/)

Individual pages for each service type (LivingSpaces, SustainableTrips, etc.)

API Integration (lib/api.ts)
The API service layer provides:

Authentication: Login, register, logout, profile management
User Management: Profile updates, wallet balance
Service Management: CRUD operations, reviews, bookings
Payment Processing: Order creation, verification
Transaction Management: History, stats
Admin Functions: Dashboard stats, user management
Mock Data Fallback: Works offline with demo data

Key Features:

Automatic token management
Error handling with fallback to mock data
TypeScript interfaces for type safety
Centralized configuration

Backend Architecture (backend/)
Core Structure
backend/
├── src/
│   ├── config/           # Database, Supabase, Razorpay config
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Auth, validation, error handling
│   ├── models/           # Database schema
│   ├── routes/           # API route definitions
│   ├── utils/            # Helpers and constants
│   └── app.ts           # Express app setup
├── migrations/           # Database migrations
├── scripts/             # Seed scripts
└── package.json
Database Schema (src/models/schema.ts)
Core Tables

users: User accounts with roles (user/org/admin)
services: Services offered by organizations
transactions: All financial transactions
conversion_requests: Org requests to convert coins to fiat
payment_transactions: Razorpay payment details
service_reviews: User reviews for services
audit_logs: System audit trail

Key Relationships

Users → Services (one-to-many)
Users → Transactions (one-to-many)
Services → Reviews (one-to-many)
Organizations → Conversion Requests (one-to-many)

API Routes Structure
Authentication (/api/v1/auth)

POST /register - User registration
POST /login - User login
GET /profile - Get user profile
PUT /password - Update password
POST /logout - User logout

User Management (/api/v1/users)

GET /profile - Get user profile
PUT /profile - Update profile
GET /wallet - Get wallet balance

Services (/api/v1/services)

GET / - List services with filters
POST / - Create service (org only)
GET /:id - Get service details
PUT /:id - Update service
DELETE /:id - Delete service
POST /:id/reviews - Add review
POST /:id/book - Book service

Payments (/api/v1/payments)

POST /orders - Create payment order
POST /verify - Verify payment
POST /webhook - Payment webhooks
POST /refund - Process refunds

Transactions (/api/v1/transactions)

GET / - List transactions
GET /stats - Transaction statistics
GET /:id - Get transaction details

Admin (/api/v1/admin)

GET /dashboard - Dashboard stats
GET /activity - Recent activity
POST /services/:id/approve - Approve service
POST /users/:id/suspend - Suspend user

Services Layer
Core Services

AuthService: Authentication and user management
UserService: User profile and wallet management
ServiceService: Service CRUD and reviews
PaymentService: Razorpay integration
TransactionService: Transaction management
ConversionService: Coin-to-fiat conversions
AdminService: Platform administration
AuditService: Activity logging

Middleware
Authentication

authenticateToken: JWT token validation
optionalAuth: Optional authentication for public endpoints
validateApiKey: API key validation

Authorization

requireRole: Role-based access control
requireAdmin: Admin-only access
checkOwnership: Resource ownership validation

Validation

validateBody: Request body validation with Joi
validateQuery: Query parameter validation
validateParams: URL parameter validation

Payment Integration
Razorpay Setup

Order creation with proper amount conversion
Signature verification for security
Webhook handling for payment updates
Refund processing
Multiple payment methods (UPI, cards, wallets)

Key Features
Authentication & Authorization

JWT-based authentication
Role-based access control (User/Org/Admin)
Secure password hashing with bcrypt
Session management with localStorage

Digital Coin System

1:1 coin-to-currency ratio
Instant coin purchase via Razorpay
Wallet balance management
Transaction history tracking

Service Marketplace

Service listing with categories
Search and filter functionality
Service reviews and ratings
Booking system with coin deduction

Payment Processing

Razorpay integration for Indian payments
UPI, card, and wallet support
Secure payment verification
Refund capabilities

Admin Dashboard

Platform statistics and metrics
User management (suspend/activate)
Service approval workflow
Conversion request management

Organization Features

Service creation and management
Earnings tracking
Coin-to-fiat conversion requests
Service performance analytics

Environment Configuration
Frontend Environment Variables
VITE_API_URL=https://your-backend-url/api/v1
Backend Environment Variables
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Admin
ADMIN_EMAIL=admin@erthaexchange.com
ADMIN_PASSWORD=admin123
Database Setup
Migrations

0001_initial_schema.sql: Core tables and relationships
0002_payment_tables.sql: Payment-related tables
0003_indexes_and_triggers.sql: Performance optimizations

Seed Data

Admin user account
Sample organization account
Demo services
Sample transactions

Development Workflow
Local Development

Start PostgreSQL database
Run backend: cd backend && npm run dev
Run frontend: npm run dev
Access at http://localhost:8080

Demo Accounts

Admin: admin@erthaexchange.com / admin123
Organization: org@techsolutions.com / org123
User: john@example.com / user123

API Integration Patterns
Error Handling

Graceful degradation to mock data
User-friendly error messages
Comprehensive logging
Network timeout handling

Authentication Flow

User login → JWT token received
Token stored in localStorage
Token included in API requests
Server validates token for protected routes

Payment Flow

User selects amount → Frontend creates order
Razorpay payment modal → User completes payment
Frontend verifies payment → Backend confirms transaction
Wallet balance updated → Success notification

Security Features
Backend Security

Helmet.js for security headers
CORS configuration
Rate limiting
Input validation with Joi
SQL injection prevention (Drizzle ORM)
XSS protection

Frontend Security

Input sanitization
Secure token storage
Route protection
Role-based UI rendering

Testing & Debugging
API Testing Component

Built-in API connectivity testing
Network error simulation
Demo data fallback verification
Environment configuration validation

Development Tools

Debug API button (development only)
Comprehensive logging
Error boundary components
Network request monitoring

Deployment Considerations
Frontend Deployment

Static site hosting (Netlify/Vercel)
Environment variable configuration
Build optimization
PWA capabilities

Backend Deployment

Node.js hosting (Railway/Heroku/AWS)
Database hosting (Supabase/AWS RDS)
Environment variable security
Load balancing considerations

Known Issues & Limitations

Offline Mode: Currently uses localStorage for demo data
File Upload: Limited to Supabase integration
Real-time Features: No WebSocket implementation
Mobile Optimization: Basic responsive design
Internationalization: English only

Extension Points
Potential Enhancements

Real-time Notifications: WebSocket integration
Advanced Analytics: Charts and reporting
Mobile App: React Native version
Multi-currency: Support for multiple currencies
Advanced Search: Elasticsearch integration
Social Features: User reviews and ratings
API Rate Limiting: Per-user rate limits
Caching Layer: Redis implementation

Integration Opportunities

Email Service: SendGrid/Mailgun
SMS Service: Twilio integration
Analytics: Google Analytics/Mixpanel
Monitoring: Sentry error tracking
CDN: CloudFlare integration

This documentation provides a complete overview of the ErthaExchange codebase, enabling any AI or developer to understand the architecture, troubleshoot issues, and implement new features effectively.
