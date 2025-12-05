import express from "express";
import { logger } from "../utils/logger.js";
import { sequelize } from "../models/index.js";
import Tenant from "../models/Tenant.js";

const router = express.Router();

/**
 * POST /init/database
 * Initialize database tables directly
 * This creates Tenants table without relying on model associations
 */
router.post("/database", async (req, res) => {
  try {
    logger.info("🔧 Initializing database...");

    // Force create Tenant table
    logger.info("Creating Tenant table...");
    await Tenant.sync({ force: false }); // force: false means don't drop existing table
    logger.info("✓ Tenant table initialized");

    return res.json({
      success: true,
      message: "✓ Database initialized successfully",
      nextStep: "Go to /seed to seed demo data",
    });
  } catch (error) {
    logger.error("Database init failed", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Database init failed: " + error.message,
      error: error.message,
    });
  }
});

/**
 * POST /seed/demo
 * Create demo tenant
 */
router.post("/demo", async (req, res) => {
  try {
    logger.info("🌱 Starting seed...");

    // Ensure Tenant table exists
    logger.info("Ensuring Tenant table exists...");
    await Tenant.sync({ force: false });
    logger.info("✓ Tenant table verified");

    // Check if demo tenant already exists
    logger.info("Checking for existing demo tenant...");
    let tenant = await Tenant.findOne({
      where: { shopDomain: "demo-store.myshopify.com" },
    });

    if (tenant) {
      logger.info("✓ Demo tenant already exists");
      return res.json({
        success: true,
        message: "Demo tenant already exists",
        tenantId: tenant.id,
        credentials: {
          email: "demo@xeno.com",
          tenantId: tenant.id,
        },
      });
    }

    // Create demo tenant
    logger.info("Creating demo tenant...");
    tenant = await Tenant.create({
      shopName: "Demo Store",
      shopDomain: "demo-store.myshopify.com",
      accessToken: "demo-token-" + Date.now(),
    });
    logger.info(`✓ Demo tenant created with ID: ${tenant.id}`);

    return res.json({
      success: true,
      message: "✓ Seed completed successfully",
      tenant: {
        id: tenant.id,
        shopName: tenant.shopName,
        shopDomain: tenant.shopDomain,
      },
      credentials: {
        email: "demo@xeno.com",
        tenantId: tenant.id,
      },
      nextSteps: "Go to dashboard and login",
    });
  } catch (error) {
    logger.error("Seed failed", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Seed failed: " + error.message,
      error: error.message,
    });
  }
});

export default router;
