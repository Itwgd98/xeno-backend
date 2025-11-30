import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const Tenant = sequelize.define("Tenant", {
  shopName: DataTypes.STRING,
  shopDomain: { type: DataTypes.STRING, unique: true },
  accessToken: DataTypes.STRING
});

export default Tenant;
