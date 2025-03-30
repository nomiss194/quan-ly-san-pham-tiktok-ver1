const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Goal = sequelize.define('Goal', {
    month: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_goal: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    video_goal: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'month', 'year']
      }
    ]
  });

  Goal.associate = (models) => {
    Goal.belongsTo(models.User, { foreignKey: 'user_id' });
    Goal.hasMany(models.CategoryGoal, { foreignKey: 'goal_id' });
  };

  return Goal;
};