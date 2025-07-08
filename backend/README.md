# ErthaExchange Backend

Production-ready backend for the ErthaExchange platform built with Node.js, TypeScript, Supabase, and Drizzle ORM.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with role-based access control
- 💰 **Wallet System**: Secure coin management with transaction tracking
- 🏪 **Service Marketplace**: Service creation, booking, and management
- 💱 **Coin Conversion**: Fiat-to-coin conversion with admin approval workflow
- 📊 **Admin Dashboard**: Complete platform management and analytics
- 🔍 **Audit Logging**: Comprehensive activity tracking
- 🛡️ **Security**: Rate limiting, CORS, helmet, input validation
- 📈 **Scalable Architecture**: MVC pattern with service layer

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Authentication**: JWT
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase account)
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd erthaexchange-backend