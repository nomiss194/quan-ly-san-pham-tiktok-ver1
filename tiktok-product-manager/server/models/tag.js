const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Tag = sequelize.define('Tag', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    color: { // Added color field
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: '#cccccc'
    }
  }, {
    timestamps: true,
    underscored: true // Thêm dòng này
  });

  Tag.associate = (models) => {
    Tag.belongsToMany(models.Product, {
        through: models.ProductTag,
        foreignKey: 'tag_id',
        otherKey: 'product_id'
     });
     Tag.hasMany(models.CategoryGoal, { foreignKey: 'tag_id' });
  };

  return Tag;
};