import cron from 'node-cron';
import { Tenant, Customer, Order, Product, Store } from '../models/index.js';
import { syncTenantData } from '../services/shopifyService.js';
import { logger } from '../utils/logger.js';

/**
 * Schedule periodic sync jobs for all tenants
 * Runs every hour by default
 */
export function scheduleSync(cronExpression = '0 * * * *') {
  try {
    logger.info('Scheduling sync job', { cronExpression });

    cron.schedule(cronExpression, async () => {
      await runSyncJob();
    });

    logger.info('Sync job scheduled successfully');
  } catch (err) {
    logger.error('Failed to schedule sync job', { error: err.message });
  }
}

/**
 * Run sync for all tenants
 */
export async function runSyncJob() {
  try {
    logger.info('Starting scheduled sync job');

    const tenants = await Tenant.findAll();
    let successCount = 0;
    let failureCount = 0;

    for (const tenant of tenants) {
      try {
        await syncTenantData(tenant, Customer, Order, Product, Store);
        successCount++;
      } catch (err) {
        logger.error('Sync failed for tenant', { tenantId: tenant.id, error: err.message });
        failureCount++;
      }
    }

    logger.info('Scheduled sync job completed', { 
      total: tenants.length, 
      success: successCount, 
      failures: failureCount 
    });
  } catch (err) {
    logger.error('Sync job error', { error: err.message });
  }
}

export default { scheduleSync, runSyncJob };
