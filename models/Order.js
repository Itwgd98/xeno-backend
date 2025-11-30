import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const Order = sequelize.define("Order", {
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  shopId: { type: DataTypes.STRING, unique: true },
  total: { type: DataTypes.FLOAT, defaultValue: 0 },
  createdAt: { type: DataTypes.DATE, allowNull: false }
});

export default Order;
