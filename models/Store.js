import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const Store = sequelize.define("Store", {
  shop: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  accessToken: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // 🔥 REQUIRED for multi-tenant support
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
});

// 🔥 Associations (Sequelize will call this later from models/index.js)
Store.associate = (models) => {
  Store.belongsTo(models.Tenant, {
    foreignKey: "tenantId",
    onDelete: "CASCADE",
  });

  // Each store has its own customers, products, orders
  Store.hasMany(models.Customer, { foreignKey: "tenantId" });
  Store.hasMany(models.Order, { foreignKey: "tenantId" });
  Store.hasMany(models.Product, { foreignKey: "tenantId" });
};

export default Store;
