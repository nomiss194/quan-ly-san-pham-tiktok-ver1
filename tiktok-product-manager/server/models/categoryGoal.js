const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CategoryGoal = sequelize.define('CategoryGoal', {
    product_goal: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['goal_id', 'tag_id']
      }
    ],
    underscored: true, // Add this line
    tableName: 'category_goals' // Add this line to explicitly define table name
  });

  CategoryGoal.associate = (models) => {
    CategoryGoal.belongsTo(models.Goal, { foreignKey: 'goal_id' });
    CategoryGoal.belongsTo(models.Tag, { foreignKey: 'tag_id' });
  };

  return CategoryGoal;
};