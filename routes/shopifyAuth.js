import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import Store from "../models/Store.js";
import Tenant from "../models/Tenant.js";
import { logger } from "../utils/logger.js";

dotenv.config();

const router = express.Router();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SCOPES = "read_customers,read_orders,read_products";
const REDIRECT_URI = `${process.env.BACKEND_URL}/auth/callback`;

// STEP 1 — Redirect user to Shopify OAuth
router.get("/install", (req, res) => {
  const shop = req.query.shop;

  if (!shop) return res.status(400).send("Shop parameter missing");

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${REDIRECT_URI}&state=12345`;

  res.redirect(installUrl);
});

// STEP 2 — OAuth callback - persist token to database
router.get("/callback", async (req, res) => {
  const { shop, code } = req.query;

  if (!shop || !code) {
    return res.status(400).send("Missing shop or code");
  }

  try {
    // Exchange code for token
    const tokenResponse = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Find or create tenant
    let tenant = await Tenant.findOne({ where: { shopDomain: shop } });
    if (!tenant) {
      tenant = await Tenant.create({
        shopName: shop.split('.')[0],
        shopDomain: shop,
        accessToken
      });
      logger.info('New tenant created', { shop, tenantId: tenant.id });
    } else {
      await tenant.update({ accessToken });
      logger.info('Tenant updated with new token', { shop, tenantId: tenant.id });
    }

    // Save or update store
    let store = await Store.findOne({ where: { shop, tenantId: tenant.id } });
    if (!store) {
      store = await Store.create({
        shop,
        accessToken,
        tenantId: tenant.id,
        webhooksConfigured: false
      });
      logger.info('New store created', { shop, storeId: store.id });
    } else {
      await store.update({ accessToken });
      logger.info('Store updated with new token', { shop, storeId: store.id });
    }

    res.json({
      message: "Shop connected successfully!",
      shop,
      tenantId: tenant.id,
      accessToken
    });
  } catch (err) {
    logger.error("OAuth Error", { shop, error: err.response?.data || err.message });
    return res.status(500).send("OAuth failed: " + (err.response?.data?.error_description || err.message));
  }
});

export default router;
