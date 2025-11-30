import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const Customer = sequelize.define("Customer", {
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  shopId: { type: DataTypes.STRING, unique: true },
  email: DataTypes.STRING,
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  totalSpent: { type: DataTypes.FLOAT, defaultValue: 0 }
});

export default Customer;
