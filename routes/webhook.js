const express = require("express");
const crypto = require("crypto");
const { Order, Customer, Product, Tenant } = require("../models");

const router = express.Router();

function verifyShopifyWebhook(req, secret) {
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256");
  const body = req.rawBody;

  const hash = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");

  return hash === hmacHeader;
}

// Raw body parser for Shopify
router.use(
  express.raw({ type: "application/json" })
);

router.post("/", async (req, res) => {
  try {
    const shopDomain = req.get("X-Shopify-Shop-Domain");
    const topic = req.get("X-Shopify-Topic");

    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!verifyShopifyWebhook(req, secret)) {
      return res.status(401).send("Invalid signature");
    }

    const tenant = await Tenant.findOne({ where: { shopDomain } });
    if (!tenant) return res.status(200).send("Tenant not found");

    const data = JSON.parse(req.body.toString("utf8"));

    switch (topic) {
      case "orders/create":
      case "orders/updated":
        await Order.upsert({
          shopId: data.id,
          tenantId: tenant.id,
          total: data.total_price,
          createdAt: data.created_at,
        });

        if (data.customer) {
          await Customer.upsert({
            shopId: data.customer.id,
            tenantId: tenant.id,
            email: data.customer.email,
            firstName: data.customer.first_name,
            lastName: data.customer.last_name,
            totalSpent: data.total_price,
          });
        }
        break;

      case "products/create":
      case "products/update":
        await Product.upsert({
          shopId: data.id,
          tenantId: tenant.id,
          title: data.title,
          price: data.variants?.[0]?.price || 0,
        });
        break;

      default:
        break;
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error", err);
    res.status(500).send("Error");
  }
});

module.exports = router;
