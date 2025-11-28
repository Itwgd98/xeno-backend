import express from "express";
import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";

const router = express.Router();

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ["read_products", "read_orders", "read_customers"],
  hostName: process.env.HOST.replace("https://", ""),
});

// Step 1 — Install URL
router.get("/auth", async (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send("Missing shop parameter");

  const authRoute = await shopify.auth.begin({
    shop,
    callbackPath: "/auth/callback",
    isOnline: false,
  });

  res.redirect(authRoute);
});

// Step 2 — Callback URL
router.get("/auth/callback", async (req, res) => {
  try {
    const { session } = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    res.send("App installed successfully 🚀");
  } catch (err) {
    console.error(err);
    res.status(500).send("OAuth error");
  }
});

export default router;
