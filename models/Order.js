import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const Order = sequelize.define("Order", {
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  shopId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  },
  total: { type: DataTypes.FLOAT, defaultValue: 0, validate: { min: 0 } },
  currency: { type: DataTypes.STRING, defaultValue: 'USD' },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['tenantId', 'shopId'] },
    { fields: ['tenantId'] },
    { fields: ['createdAt'] }
  ]
});

export default Order;
