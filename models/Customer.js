import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const Customer = sequelize.define("Customer", {
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  shopId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  },
  email: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  totalSpent: { type: DataTypes.FLOAT, defaultValue: 0, validate: { min: 0 } },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['tenantId', 'shopId'] },
    { fields: ['tenantId'] },
    { fields: ['email'] }
  ]
});

export default Customer;
