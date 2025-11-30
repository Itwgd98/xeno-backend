import express from "express";
import crypto from "crypto";
import { Tenant, Order, Customer, Product } from "../models/index.js";

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
      return res.status(401).send("Invalid HMAC signature");
    }

    const topic = req.get("X-Shopify-Topic");
    const shopDomain = req.get("X-Shopify-Shop-Domain");

    const tenant = await Tenant.findOne({ where: { shopDomain } });
    if (!tenant) return res.status(200).send("Tenant not found");

    const payload = JSON.parse(req.body.toString("utf8"));

    switch (topic) {
      case "orders/create":
      case "orders/updated":
        await Order.upsert({
          shopId: payload.id,
          tenantId: tenant.id,
          total: parseFloat(payload.total_price || 0),
          createdAt: payload.created_at,
        });

        if (payload.customer) {
          await Customer.upsert({
            shopId: payload.customer.id,
            tenantId: tenant.id,
            email: payload.customer.email,
            firstName: payload.customer.first_name,
            lastName: payload.customer.last_name,
            totalSpent: parseFloat(payload.total_price || 0),
          });
        }
        break;

      case "products/create":
      case "products/update":
        await Product.upsert({
          shopId: payload.id,
          tenantId: tenant.id,
          title: payload.title,
          price: parseFloat(payload.variants?.[0]?.price || 0),
        });
        break;

      default:
        console.log("Unhandled Shopify topic:", topic);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Error");
  }
});

export default router;
