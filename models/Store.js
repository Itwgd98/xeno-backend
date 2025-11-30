import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const Store = sequelize.define("Store", {
  shop: { type: DataTypes.STRING, unique: true },
  accessToken: DataTypes.STRING,
  tenantId: { type: DataTypes.INTEGER, allowNull: false }
});

export default Store;
