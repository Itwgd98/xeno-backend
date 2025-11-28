import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const Store = sequelize.define("Store", {
  shop: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

export default Store;
