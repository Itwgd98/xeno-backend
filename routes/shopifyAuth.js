import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import Store from "./models/store.js";



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

// STEP 2 — OAuth callback
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

    // Save token later in DB… for now return success
    return res.json({
      message: "Shop connected successfully!",
      shop,
      accessToken,
    });
  } catch (err) {
    console.error("OAuth Error:", err.response?.data || err);
    return res.status(500).send("OAuth failed");
  }
});

export default router;
