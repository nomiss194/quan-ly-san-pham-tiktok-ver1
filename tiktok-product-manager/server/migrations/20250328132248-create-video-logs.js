'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('video_logs', { // Table name from model
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products', // References the 'products' table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If product is deleted, delete its logs
      },
      date: {
        type: Sequelize.DATEONLY, // Matches model, maps to DATE in PG
        allowNull: false
      },
      count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { // Add validation as per plan.md
            min: 0
        }
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

    // Add unique index on product_id, date as per plan.md
    await queryInterface.addIndex('video_logs', ['product_id', 'date'], {
      name: 'idx_videolog_product_date', // Name from plan.md
      unique: true
    });
  },

  async down (queryInterface, Sequelize) {
    // await queryInterface.removeIndex('video_logs', 'idx_videolog_product_date');
    await queryInterface.dropTable('video_logs');
  }
};
