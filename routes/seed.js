import express from "express";
import { logger } from "../utils/logger.js";
import { syncDB } from "../models/index.js";
import Tenant from "../models/Tenant.js";
import Store from "../models/Store.js";

const router = express.Router();

/**
 * POST /seed/demo
 * Create demo tenant and store for testing
 */
router.post("/demo", async (req, res) => {
  try {
    logger.info("Starting database seed...");

    // Step 1: Sync database schema
    logger.info("Step 1: Syncing database schema...");
    await syncDB();
    logger.info("✓ Database schema synced");

    // Step 2: Check if demo tenant already exists
    logger.info("Step 2: Checking for existing demo tenant...");
    let tenant = await Tenant.findOne({
      where: { shopDomain: "demo-store.myshopify.com" },
    });

    if (tenant) {
      logger.info("✓ Demo tenant already exists");
      return res.json({
        success: true,
        message: "Demo tenant already exists",
        tenantId: tenant.id,
      });
    }

    // Step 3: Create demo tenant
    logger.info("Step 3: Creating demo tenant...");
    tenant = await Tenant.create({
      shopName: "Demo Store",
      shopDomain: "demo-store.myshopify.com",
      accessToken: "demo-token-" + Date.now(),
    });
    logger.info(`✓ Demo tenant created with ID: ${tenant.id}`);

    // Step 4: Create demo store (if Store model exists)
    logger.info("Step 4: Creating demo store...");
    try {
      const store = await Store.create({
        tenantId: tenant.id,
        shopId: "demo-store",
        name: "Demo Store",
        domain: "demo-store.myshopify.com",
        accessToken: "demo-token",
        plan: "BASIC",
        webhooksConfigured: false,
        lastSyncAt: new Date(),
      });
      logger.info(`✓ Demo store created with ID: ${store.id}`);
    } catch (storeError) {
      logger.warn("Could not create store (may not be needed)", { error: storeError.message });
    }

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

/**
 * GET /seed/status
 * Check if demo tenant exists
 */
router.get("/status", async (req, res) => {
  try {
    const tenant = await Tenant.findOne({
      where: { shopDomain: "demo-store.myshopify.com" },
    });

    if (tenant) {
      return res.json({
        success: true,
        message: "Demo tenant exists",
        tenant: {
          id: tenant.id,
          shopName: tenant.shopName,
          shopDomain: tenant.shopDomain,
        },
      });
    } else {
      return res.json({
        success: false,
        message: "Demo tenant does not exist. Run POST /seed/demo first",
      });
    }
  } catch (error) {
    logger.error("Status check failed", {
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: "Status check failed",
      error: error.message,
    });
  }
});

export default router;
