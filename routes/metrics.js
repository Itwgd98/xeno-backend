import express from "express";
import { Op } from "sequelize";
import { Order, Customer } from "../models/index.js";
import { logger } from "../utils/logger.js";
import authMiddleware from "../middleware/auth.js";
import Tenant from "../models/Tenant.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    // Get tenant from auth middleware
    const tenantId = req.user.tenantId;
    
    // Get tenant to validate it exists
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(401).json({ error: "Tenant not found" });
    }

    const { from, to } = req.query;

    // Build date filters
    const dateFilter = {};
    if (from) dateFilter[Op.gte] = new Date(from);
    if (to) dateFilter[Op.lte] = new Date(to);

    const where = { tenantId };
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    const totalCustomers = await Customer.count({ where: { tenantId } });
    const totalOrders = await Order.count({ where });
    const totalRevenue = (await Order.sum("total", { where })) || 0;

    const ordersByDate = await Order.sequelize.query(
      `
      SELECT DATE("createdAt") AS day, 
             SUM(total) AS revenue,
             COUNT(*) AS orders
      FROM "Orders"
      WHERE "tenantId" = :tenantId
      ${from ? 'AND "createdAt" >= :from' : ''}
      ${to ? 'AND "createdAt" <= :to' : ''}
      GROUP BY day
      ORDER BY day ASC
      `,
      {
        replacements: { 
          tenantId, 
          ...(from && { from: new Date(from) }),
          ...(to && { to: new Date(to) })
        },
        type: Order.sequelize.QueryTypes.SELECT,
      }
    );

    const topCustomers = await Customer.findAll({
      where: { tenantId },
      order: [["totalSpent", "DESC"]],
      limit: 5,
      attributes: ['id', 'email', 'firstName', 'lastName', 'totalSpent']
    });

    logger.debug('Metrics fetched', { tenantId, from, to });

    res.json({
      totalCustomers,
      totalOrders,
      totalRevenue,
      ordersByDate,
      topCustomers,
    });
  } catch (err) {
    logger.error("Metrics error", { error: err.message });
    res.status(500).json({ error: "Error fetching metrics" });
  }
});

export default router;
