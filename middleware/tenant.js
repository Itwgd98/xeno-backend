import { Tenant } from "../models/index.js";

export default async function tenantMiddleware(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    const shopDomain = req.headers["x-shop-domain"];

    let tenant;

    if (tenantId && /^\d+$/.test(tenantId)) {
      tenant = await Tenant.findByPk(tenantId);
    } else if (shopDomain) {
      tenant = await Tenant.findOne({ where: { shopDomain } });
    }

    if (!tenant) {
      return res.status(401).json({ error: "Tenant not found" });
    }

    req.tenant = tenant;

    next();
  } catch (err) {
    console.error("Tenant middleware error:", err);
    res.status(500).json({ error: "Middleware error" });
  }
}
