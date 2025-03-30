'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('goals', { // Table name lowercase
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false, // Goals must belong to a user
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If user is deleted, delete their goals
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: { // Add validation as per plan.md
          min: 1,
          max: 12
        }
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      product_goal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0 // Default value as per plan.md
      },
      video_goal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0 // Default value as per plan.md
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add unique index on user_id, month, year
    await queryInterface.addIndex('goals', ['user_id', 'month', 'year'], {
      name: 'idx_goals_user_month_year', // Name from plan.md
      unique: true
    });
  },

  async down (queryInterface, Sequelize) {
    // await queryInterface.removeIndex('goals', 'idx_goals_user_month_year');
    await queryInterface.dropTable('goals');
  }
};
