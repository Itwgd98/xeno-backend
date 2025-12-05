import express from "express";
import crypto from "crypto";
import { Tenant, Order, Customer, Product } from "../models/index.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

// Shopify HMAC verification
function verifyShopifyWebhook(req, secret) {
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256");
  const body = req.body; // raw buffer
  const digest = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");
  return digest === hmacHeader;
}

// IMPORTANT: DO NOT USE express.json() here.
// This route is wrapped with express.raw() in server.js

router.post("/", async (req, res) => {
  try {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    
    if (!verifyShopifyWebhook(req, secret)) {
      logger.warn('Invalid webhook HMAC signature');
      return res.status(401).send("Invalid HMAC signature");
    }

    const topic = req.get("X-Shopify-Topic");
    const shopDomain = req.get("X-Shopify-Shop-Domain");

    const tenant = await Tenant.findOne({ where: { shopDomain } });
    if (!tenant) {
      logger.warn('Webhook received for unknown tenant', { shopDomain, topic });
      return res.status(200).send("Tenant not found");
    }

    const payload = JSON.parse(req.body.toString("utf8"));

    logger.debug('Webhook received', { shopDomain, topic, payloadId: payload.id });

    switch (topic) {
      case "orders/create":
      case "orders/updated":
        await Order.upsert({
          shopId: payload.id.toString(),
          tenantId: tenant.id,
          total: parseFloat(payload.total_price || 0),
          currency: payload.currency,
          status: payload.financial_status,
          createdAt: payload.created_at,
        });

        if (payload.customer) {
          await Customer.upsert({
            shopId: payload.customer.id.toString(),
            tenantId: tenant.id,
            email: payload.customer.email,
            firstName: payload.customer.first_name,
            lastName: payload.customer.last_name,
            totalSpent: parseFloat(payload.total_price || 0),
          });
        }
        logger.debug('Order upserted', { tenantId: tenant.id, shopId: payload.id });
        break;

      case "products/create":
      case "products/update":
        await Product.upsert({
          shopId: payload.id.toString(),
          tenantId: tenant.id,
          title: payload.title,
          price: parseFloat(payload.variants?.[0]?.price || 0),
          sku: payload.variants?.[0]?.sku,
          status: payload.status
        });
        logger.debug('Product upserted', { tenantId: tenant.id, shopId: payload.id });
        break;

      case "customers/create":
      case "customers/update":
        await Customer.upsert({
          shopId: payload.id.toString(),
          tenantId: tenant.id,
          email: payload.email,
          firstName: payload.first_name,
          lastName: payload.last_name,
          totalSpent: parseFloat(payload.total_spent || 0)
        });
        logger.debug('Customer upserted', { tenantId: tenant.id, shopId: payload.id });
        break;

      default:
        logger.debug("Unhandled Shopify topic", { topic });
    }

    res.status(200).send("OK");
  } catch (err) {
    logger.error("Webhook error", { error: err.message, stack: err.stack });
    res.status(500).send("Error");
  }
});

export default router;
