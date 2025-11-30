module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    shopId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    total: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  Order.associate = (models) => {
    Order.belongsTo(models.Tenant, { foreignKey: "tenantId" });
  };

  return Order;
};
