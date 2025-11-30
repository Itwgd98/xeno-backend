import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import sequelize from "./utils/db.js";

// ES-module imports for your routes
import shopifyRoutes from "./routes/shopify.js";
import shopifyAuthRoutes from "./routes/shopifyAuth.js";
import webhookRoute from "./routes/webhook.js";
import metricsRoute from "./routes/metrics.js";
import tenantMiddleware from "./middleware/tenant.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ------------------------------------------------------
   1) CORS + JSON
------------------------------------------------------ */
app.use(cors());
app.use(express.json());

/* ------------------------------------------------------
   2) Shopify Webhooks (MUST use raw body)
------------------------------------------------------ */
app.use(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhookRoute
);

/* ------------------------------------------------------
   3) Shopify OAuth & Shopify REST routes
------------------------------------------------------ */
app.use("/auth", shopifyAuthRoutes);
app.use("/", shopifyRoutes);

/* ------------------------------------------------------
   4) Metrics API (use tenant middleware)
------------------------------------------------------ */
app.use("/metrics", tenantMiddleware, metricsRoute);

/* ------------------------------------------------------
   5) Serve Frontend (static files)
------------------------------------------------------ */
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

/* ------------------------------------------------------
   6) Database Connection
------------------------------------------------------ */
sequelize
  .authenticate()
  .then(() => console.log("✅ PostgreSQL Connected"))
  .catch((err) => console.log("❌ DB Error:", err));

/* ------------------------------------------------------
   7) Start Server
------------------------------------------------------ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
