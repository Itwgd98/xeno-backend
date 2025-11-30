import express from "express";
import { Order, Customer } from "../models/index.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const tenantId = req.tenant.id;

    const totalCustomers = await Customer.count({ where: { tenantId } });
    const totalOrders = await Order.count({ where: { tenantId } });

    const totalRevenue = (await Order.sum("total", { where: { tenantId } })) || 0;

    const ordersByDate = await Order.sequelize.query(
      `
      SELECT DATE("createdAt") AS day, 
             SUM(total) AS revenue,
             COUNT(*) AS orders
      FROM "Orders"
      WHERE "tenantId" = :tenantId
      GROUP BY day
      ORDER BY day ASC
      `,
      {
        replacements: { tenantId },
        type: Order.sequelize.QueryTypes.SELECT,
      }
    );

    const topCustomers = await Customer.findAll({
      where: { tenantId },
      order: [["totalSpent", "DESC"]],
      limit: 5,
    });

    res.json({
      totalCustomers,
      totalOrders,
      totalRevenue,
      ordersByDate,
      topCustomers,
    });
  } catch (err) {
    console.error("Metrics error:", err);
    res.status(500).json({ error: "Error fetching metrics" });
  }
});

export default router;
