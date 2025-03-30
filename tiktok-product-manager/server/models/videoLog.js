'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class VideoLog extends Model {
    static associate(models) {
      VideoLog.belongsTo(models.Product, { foreignKey: 'product_id' });
    }
  }
  VideoLog.init({
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'VideoLog',
    tableName: 'video_logs', // Đảm bảo khớp tên bảng trong migration
    underscored: true, // Sử dụng created_at và updated_at
  });
  return VideoLog;
};