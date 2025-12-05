import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import sequelize from "./utils/db.js";
import { logger } from "./utils/logger.js";
import { scheduleSync } from "./jobs/syncScheduler.js";

// ES-module imports for your routes
import shopifyRoutes from "./routes/shopify.js";
import shopifyAuthRoutes from "./routes/shopifyAuth.js";
import webhookRoute from "./routes/webhook.js";
import metricsRoute from "./routes/metrics.js";
import authRoute from "./routes/auth.js";
import ordersRoute from "./routes/orders.js";
import syncRoute from "./routes/sync.js";
import seedRoute from "./routes/seed.js";
import initRoute from "./routes/init.js";

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
   3) Authentication & Sync routes (public login, protected sync)
------------------------------------------------------ */
app.use("/auth", authRoute);
app.use("/sync", syncRoute);
app.use("/seed", seedRoute);
app.use("/init", initRoute);

/* ------------------------------------------------------
   4) Shopify OAuth routes
------------------------------------------------------ */
app.use("/auth/shopify", shopifyAuthRoutes);

/* ------------------------------------------------------
   5) Orders API (protected)
------------------------------------------------------ */
app.use("/orders", ordersRoute);

/* ------------------------------------------------------
   6) Metrics API (use tenant middleware as fallback)
------------------------------------------------------ */
app.use("/metrics", tenantMiddleware, metricsRoute);

/* ------------------------------------------------------
   7) Legacy Shopify REST routes (if needed)
------------------------------------------------------ */
app.use("/", shopifyRoutes);

/* ------------------------------------------------------
   8) Serve Frontend (static files)
------------------------------------------------------ */
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.get("/seed", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "seed.html"));
});

/* ------------------------------------------------------
   7) Health check
------------------------------------------------------ */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ------------------------------------------------------
   8) Error handling middleware
------------------------------------------------------ */
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    path: req.path,
    method: req.method,
    stack: err.stack
  });
  res.status(500).json({ error: 'Internal server error' });
});

/* ------------------------------------------------------
   9) Database Connection
------------------------------------------------------ */
sequelize
  .authenticate()
  .then(() => {
    logger.info('PostgreSQL connected');
    // Start scheduler
    const syncInterval = process.env.SYNC_INTERVAL || '0 * * * *'; // hourly
    scheduleSync(syncInterval);
  })
  .catch((err) => logger.error('DB connection failed', { error: err.message }));

/* ------------------------------------------------------
   10) Start Server
------------------------------------------------------ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
