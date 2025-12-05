import { Sequelize } from "sequelize";
import dotenv from "dotenv";

import Customer from "./Customer.js";
import Product from "./Product.js";
import Order from "./Order.js";
import Tenant from "./Tenant.js";
import Store from "./Store.js";

dotenv.config();

// Initialize Sequelize
export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

// Test DB Connection
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
};

// Sync all models to create tables if they don't exist
export const syncDB = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synchronized successfully!");
  } catch (error) {
    console.error("Error synchronizing database:", error);
    throw error;
  }
};

/* ---------------------------------------------------------
   MODEL ASSOCIATIONS
----------------------------------------------------------*/

// 🟩 Store belongs to Tenant (multi-tenant architecture)
Store.belongsTo(Tenant, { foreignKey: "tenantId" });
Tenant.hasMany(Store, { foreignKey: "tenantId" });

// 🟩 Customers, Orders, Products all associated to a Tenant
Tenant.hasMany(Customer, { foreignKey: "tenantId" });
Customer.belongsTo(Tenant, { foreignKey: "tenantId" });

Tenant.hasMany(Order, { foreignKey: "tenantId" });
Order.belongsTo(Tenant, { foreignKey: "tenantId" });

Tenant.hasMany(Product, { foreignKey: "tenantId" });
Product.belongsTo(Tenant, { foreignKey: "tenantId" });

/*
 ❌ Removing wrong associations:
   - Shopify orders do NOT have customerId FK
   - Shopify orders do NOT have productId FK
   - Shopify orders contain multiple line items
*/

// Export all models
export { Customer, Product, Order, Tenant, Store };
