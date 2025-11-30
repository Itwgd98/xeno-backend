import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const Product = sequelize.define("Product", {
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  shopId: { type: DataTypes.STRING, unique: true },
  title: DataTypes.STRING,
  price: { type: DataTypes.FLOAT, defaultValue: 0 }
});

export default Product;
