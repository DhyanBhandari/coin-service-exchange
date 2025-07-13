import dotenv from 'dotenv';
dotenv.config();

import { initializeDatabase, getDb } from '../src/config/database';
import { users, services, transactions } from '../src/models/schema';
import { hashPassword } from '../src/utils/helpers';
import { USER_ROLES, SERVICE_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS } from '../src/utils/constants';
import { logger } from '../src/utils/logger';

// Initialize database
initializeDatabase();

async function seed() {
  try {
    logger.info('Starting database seeding...');
    const db = getDb();

    // Create admin user
    const adminPassword = await hashPassword(process.env.ADMIN_PASSWORD || 'admin123');
    const [admin] = await db
      .insert(users)
      .values({
        name: 'System Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@erthaexchange.com',
        password: adminPassword,
        role: USER_ROLES.ADMIN,
        status: 'active',
        emailVerified: true,
        walletBalance: '10000'
      })
      .returning();

    logger.info(`Admin user created: ${admin?.email}`);

    // Create sample organization
    const orgPassword = await hashPassword('org123');
    const [organization] = await db
      .insert(users)
      .values({
        name: 'Tech Solutions Inc',
        email: 'org@techsolutions.com',
        password: orgPassword,
        role: USER_ROLES.ORG,
        status: 'active',
        emailVerified: true,
        walletBalance: '5000'
      })
      .returning();

    logger.info(`Organization user created: ${organization?.email}`);

    // Create sample regular users
    const userPassword = await hashPassword('user123');
    const sampleUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: userPassword,
        role: USER_ROLES.USER,
        status: 'active',
        emailVerified: true,
        walletBalance: '1000'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: userPassword,
        role: USER_ROLES.USER,
        status: 'active',
        emailVerified: true,
        walletBalance: '1500'
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: userPassword,
        role: USER_ROLES.USER,
        status: 'active',
        emailVerified: true,
        walletBalance: '800'
      }
    ];

    const createdUsers = await db
      .insert(users)
      .values(sampleUsers)
      .returning();

    logger.info(`Created ${createdUsers.length} sample users`);

    // Create sample services
    if (!organization?.id) {
      throw new Error('Organization ID is undefined. Cannot seed services without a valid organization.');
    }

    const sampleServices = [
      {
        title: 'Web Development Services',
        description: 'Professional web development services including frontend and backend development, database design, and deployment.',
        price: '299.99',
        category: 'technology',
        organizationId: organization.id,
        status: SERVICE_STATUS.ACTIVE,
        features: ['React/Angular Development', 'Node.js Backend', 'Database Design', 'API Integration', 'Deployment Support'],
        tags: ['web', 'development', 'react', 'nodejs'],
        bookings: 25,
        rating: '4.8'
      },
      {
        title: 'Digital Marketing Consultation',
        description: 'Comprehensive digital marketing consultation including SEO, social media strategy, and content marketing.',
        price: '199.99',
        category: 'marketing',
        organizationId: organization.id,
        status: SERVICE_STATUS.ACTIVE,
        features: ['SEO Audit', 'Social Media Strategy', 'Content Planning', 'Analytics Setup', 'Performance Tracking'],
        tags: ['marketing', 'seo', 'social-media', 'content'],
        bookings: 18,
        rating: '4.6'
      },
      {
        title: 'Business Strategy Consulting',
        description: 'Expert business strategy consulting to help grow your business and optimize operations.',
        price: '399.99',
        category: 'consulting',
        organizationId: organization.id,
        status: SERVICE_STATUS.ACTIVE,
        features: ['Market Analysis', 'Strategy Development', 'Implementation Planning', 'Performance Metrics', 'Ongoing Support'],
        tags: ['business', 'strategy', 'consulting', 'growth'],
        bookings: 12,
        rating: '4.9'
      },
      {
        title: 'Graphic Design Services',
        description: 'Creative graphic design services for branding, marketing materials, and digital assets.',
        price: '149.99',
        category: 'design',
        organizationId: organization.id,
        status: SERVICE_STATUS.PENDING,
        features: ['Logo Design', 'Brand Identity', 'Marketing Materials', 'Digital Assets', 'Print Design'],
        tags: ['design', 'graphics', 'branding', 'creative'],
        bookings: 8,
        rating: '4.7'
      }
    ];

    const createdServices = await db
      .insert(services)
      .values(sampleServices)
      .returning();

    logger.info(`Created ${createdServices.length} sample services`);

    // Create sample transactions
    const sampleTransactions = [
      {
        userId: createdUsers?.[0]?.id,
        type: TRANSACTION_TYPES.COIN_PURCHASE,
        amount: '1000',
        status: TRANSACTION_STATUS.COMPLETED,
        description: 'Coin purchase via Razorpay',
        paymentMethod: 'razorpay',
        balanceBefore: '0',
        balanceAfter: '1000'
      },
      {
        userId: createdUsers?.[1]?.id,
        type: TRANSACTION_TYPES.COIN_PURCHASE,
        amount: '1500',
        status: TRANSACTION_STATUS.COMPLETED,
        description: 'Coin purchase via Razorpay',
        paymentMethod: 'razorpay',
        balanceBefore: '0',
        balanceAfter: '1500'
      },
      {
        userId: createdUsers?.[0]?.id,
        serviceId: createdServices?.[0]?.id,
        type: TRANSACTION_TYPES.SERVICE_BOOKING,
        amount: '299.99',
        status: TRANSACTION_STATUS.COMPLETED,
        description: 'Service booking: Web Development Services',
        balanceBefore: '1000',
        balanceAfter: '700.01'
      },
      {
        userId: organization?.id,
        type: TRANSACTION_TYPES.COIN_CONVERSION,
        amount: '5000',
        status: TRANSACTION_STATUS.COMPLETED,
        description: 'Coin conversion to bank account',
        balanceBefore: '10000',
        balanceAfter: '5000'
      }
    ];

    const filteredTransactions = sampleTransactions.filter(
      (tx) => typeof tx.userId !== 'undefined' && tx.userId !== undefined
    );

    const createdTransactions = await db
      .insert(transactions)
      .values(filteredTransactions)
      .returning();

    logger.info(`Created ${createdTransactions.length} sample transactions`);

    logger.info('Database seeding completed successfully!');
    logger.info('\n--- Sample Credentials ---');
    logger.info(`Admin: ${admin?.email} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    logger.info(`Organization: ${organization?.email} / org123`);
    logger.info(`User: ${createdUsers?.[0]?.email} / user123`);
    logger.info('-------------------------\n');

  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed();
}

export default seed;
