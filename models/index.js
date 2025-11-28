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
Tenant.hasMany(Customer);
Customer.belongsTo(Tenant);

Tenant.hasMany(Product);
Product.belongsTo(Tenant);

Tenant.hasMany(Order);
Order.belongsTo(Tenant);

export { Customer, Product, Order, Tenant };
