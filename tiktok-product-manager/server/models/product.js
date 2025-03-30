const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    image_url: {
      type: DataTypes.STRING
    },
    notes: {
      type: DataTypes.TEXT
    },
    purchased: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    video_count: { // This might become redundant or represent total count
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    deleted_at: {
      type: DataTypes.DATE
    }
  }, {
    timestamps: true,
    underscored: true,
    paranoid: true
  });

  Product.associate = (models) => {
    Product.belongsTo(models.User, { foreignKey: 'user_id' });
    // Specify foreign keys for the many-to-many relationship
    Product.belongsToMany(models.Tag, {
        through: models.ProductTag,
        foreignKey: 'product_id', // Key in ProductTag pointing to Product
        otherKey: 'tag_id' // Key in ProductTag pointing to Tag
    });
    Product.hasMany(models.VideoLog, { foreignKey: 'product_id' });
  };

  return Product;
};