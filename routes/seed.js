import express from "express";
import { logger } from "../utils/logger.js";
import Tenant from "../models/Tenant.js";
import Store from "../models/Store.js";

const router = express.Router();

/**
 * POST /seed/demo
 * Create demo tenant and store for testing
 * This endpoint allows seeding without Shell access (for free Render plans)
 */
router.post("/demo", async (req, res) => {
  try {
    logger.info("Seeding demo tenant and store...");

    // Check if demo tenant already exists
    let tenant = await Tenant.findOne({
      where: { name: "Demo Tenant" },
    });

    if (tenant) {
      logger.info("Demo tenant already exists");
      return res.json({
        success: true,
        message: "Demo tenant already exists",
        tenantId: tenant.id,
      });
    }

    // Create demo tenant
    tenant = await Tenant.create({
      name: "Demo Tenant",
      shopifyApiKey: process.env.SHOPIFY_API_KEY || "demo-key",
      shopifyApiSecret: process.env.SHOPIFY_API_SECRET || "demo-secret",
    });

    logger.info(`Demo tenant created with ID: ${tenant.id}`);

    // Create demo store
    const store = await Store.create({
      tenantId: tenant.id,
      shopId: process.env.SHOPIFY_STORE_ID || "xeno-demo-store",
      name: "Demo Store",
      domain: process.env.SHOPIFY_STORE_URL || "demo-store.myshopify.com",
      accessToken: "demo-token",
      plan: "BASIC",
      webhooksConfigured: false,
      lastSyncAt: new Date(),
    });

    logger.info(`Demo store created with ID: ${store.id}`);

    return res.json({
      success: true,
      message: "Seed completed successfully",
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
      store: {
        id: store.id,
        name: store.name,
        domain: store.domain,
      },
      credentials: {
        email: "demo@xeno.com",
        tenantId: tenant.id,
      },
    });
  } catch (error) {
    logger.error("Seed failed", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Seed failed",
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
      where: { name: "Demo Tenant" },
    });

    if (tenant) {
      const stores = await Store.findAll({
        where: { tenantId: tenant.id },
      });

      return res.json({
        success: true,
        message: "Demo tenant exists",
        tenant: {
          id: tenant.id,
          name: tenant.name,
          storeCount: stores?.length || 0,
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
