import { Order } from '../models/index.js';
import { logger } from '../utils/logger.js';
import { Op } from 'sequelize';

/**
 * Get paginated orders for a tenant
 */
export const getOrders = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const {
      limit = 20,
      offset = 0,
      from,
      to,
      status
    } = req.query;

    const where = { tenantId };

    // Date range filtering
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) where.createdAt[Op.lte] = new Date(to);
    }

    // Status filtering
    if (status) {
      where.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      orders: rows
    });
  } catch (err) {
    logger.error('Get orders error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const order = await Order.findOne({
      where: { id, tenantId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    logger.error('Get order error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

export default { getOrders, getOrderById };
