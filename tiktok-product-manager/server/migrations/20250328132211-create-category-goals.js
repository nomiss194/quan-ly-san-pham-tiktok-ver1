'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('category_goals', { // Table name lowercase
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      goal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'goals', // References the 'goals' table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If the parent goal is deleted, delete the category goal
      },
      tag_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tags', // References the 'tags' table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If the tag is deleted, delete the category goal
      },
      product_goal: {
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

    // Add unique index on goal_id, tag_id
    await queryInterface.addIndex('category_goals', ['goal_id', 'tag_id'], {
      name: 'idx_category_goals_goal_tag', // Name from plan.md
      unique: true
    });
  },

  async down (queryInterface, Sequelize) {
    // await queryInterface.removeIndex('category_goals', 'idx_category_goals_goal_tag');
    await queryInterface.dropTable('category_goals');
  }
};
