import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const Store = sequelize.define("Store", {
  shop: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { notEmpty: true }
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  webhooksConfigured: { type: DataTypes.BOOLEAN, defaultValue: false },
  lastSyncAt: DataTypes.DATE,
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: true,
  indexes: [
    { fields: ['tenantId'] },
    { fields: ['shop'] }
  ]
});

export default Store;
