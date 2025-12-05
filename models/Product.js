import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const Product = sequelize.define("Product", {
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  shopId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  },
  price: { type: DataTypes.FLOAT, defaultValue: 0, validate: { min: 0 } },
  sku: DataTypes.STRING,
  status: { type: DataTypes.STRING, defaultValue: 'active' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['tenantId', 'shopId'] },
    { fields: ['tenantId'] },
    { fields: ['sku'] }
  ]
});

export default Product;
