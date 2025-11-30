const express = require("express");
const { Order, Customer } = require("../models");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const tenantId = req.tenant.id;

    const totalCustomers = await Customer.count({ where: { tenantId } });
    const totalOrders = await Order.count({ where: { tenantId } });

    const revenueResult = await Order.sum("total", { where: { tenantId } });
    const totalRevenue = revenueResult || 0;

    const ordersByDate = await Order.findAll({
      where: { tenantId },
      attributes: [
        [Order.sequelize.fn("DATE", Order.sequelize.col("createdAt")), "date"],
        [Order.sequelize.fn("SUM", Order.sequelize.col("total")), "revenue"],
      ],
      group: ["date"],
      order: [[Order.sequelize.literal("date"), "ASC"]],
    });

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
    res.status(500).json({ error: "Internal error" });
  }
});

module.exports = router;
