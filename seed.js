import dotenv from 'dotenv';
import { Tenant, Store } from './models/index.js';
import sequelize from './utils/db.js';
import { logger } from './utils/logger.js';

dotenv.config();

/**
 * Seed script - creates demo tenant and store for testing
 * Run: node seed.js
 */

async function seed() {
  try {
    logger.info('Starting database seed...');

    // Sync database tables
    await sequelize.sync({ force: false });
    logger.info('Database tables synced');

    // Check if demo tenant exists
    let tenant = await Tenant.findOne({ where: { shopDomain: 'demo.myshopify.com' } });

    if (!tenant) {
      tenant = await Tenant.create({
        shopName: 'Demo Store',
        shopDomain: 'demo.myshopify.com',
        accessToken: 'shpat_demo_token_12345'
      });
      logger.info('Demo tenant created', { tenantId: tenant.id });
    } else {
      logger.info('Demo tenant already exists', { tenantId: tenant.id });
    }

    // Create demo store
    let store = await Store.findOne({ where: { shop: 'demo.myshopify.com', tenantId: tenant.id } });

    if (!store) {
      store = await Store.create({
        shop: 'demo.myshopify.com',
        accessToken: 'shpat_demo_token_12345',
        tenantId: tenant.id,
        webhooksConfigured: false
      });
      logger.info('Demo store created', { storeId: store.id });
    } else {
      logger.info('Demo store already exists', { storeId: store.id });
    }

    logger.info('Seed completed successfully');
    logger.info(`Login with: tenantId=${tenant.id} or shopDomain=${tenant.shopDomain}`);

    process.exit(0);
  } catch (err) {
    logger.error('Seed failed', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

seed();
