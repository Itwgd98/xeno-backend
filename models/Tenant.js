import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const Tenant = sequelize.define("Tenant", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  shopName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  },
  shopDomain: {
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
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: true
});

export default Tenant;
