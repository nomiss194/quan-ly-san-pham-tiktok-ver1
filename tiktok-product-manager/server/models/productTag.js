const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductTag = sequelize.define('ProductTag', {
    product_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'tags',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'product_tags',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return ProductTag;
};