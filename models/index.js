import Customer from "./Customer.js";
import Product from "./Product.js";
import Order from "./Order.js";
import Tenant from "./Tenant.js";
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

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

// Test DB connection
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
};


// Model Associations
// Tenant relations
Tenant.hasMany(Customer, { foreignKey: "tenantId" });
Customer.belongsTo(Tenant, { foreignKey: "tenantId" });

Tenant.hasMany(Order, { foreignKey: "tenantId" });
Order.belongsTo(Tenant, { foreignKey: "tenantId" });

Tenant.hasMany(Product, { foreignKey: "tenantId" });
Product.belongsTo(Tenant, { foreignKey: "tenantId" });

// Customer ↔ Orders
Customer.hasMany(Order, { foreignKey: "customerId" });
Order.belongsTo(Customer, { foreignKey: "customerId" });

// Product ↔ Orders
Product.hasMany(Order, { foreignKey: "productId" });
Order.belongsTo(Product, { foreignKey: "productId" });

export { Customer, Product, Order, Tenant };
