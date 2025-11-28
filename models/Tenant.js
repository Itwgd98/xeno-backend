import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const Tenant = sequelize.define("Tenant", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  shopDomain: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

export default Tenant;
