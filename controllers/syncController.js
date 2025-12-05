import { syncTenantData } from '../services/shopifyService.js';
import { Tenant, Customer, Order, Product, Store } from '../models/index.js';
import { logger } from '../utils/logger.js';

/**
 * Manual sync endpoint
 */
export const syncNow = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const result = await syncTenantData(tenant, Customer, Order, Product, Store);
    
    res.json({
      message: 'Sync completed successfully',
      ...result
    });
  } catch (err) {
    logger.error('Sync endpoint error', { error: err.message });
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
};

/**
 * Get sync status
 */
export const getSyncStatus = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const store = await Store.findOne({
      where: { tenantId },
      attributes: ['lastSyncAt', 'webhooksConfigured']
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({
      lastSyncAt: store.lastSyncAt,
      webhooksConfigured: store.webhooksConfigured
    });
  } catch (err) {
    logger.error('Sync status error', { error: err.message });
    res.status(500).json({ error: 'Failed to get sync status' });
  }
};

export default { syncNow, getSyncStatus };
