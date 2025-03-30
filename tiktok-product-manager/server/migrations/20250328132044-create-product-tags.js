'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('product_tags', { // Table name lowercase
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true, // Part of composite primary key
        references: {
          model: 'products', // References the 'products' table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If a product is deleted, remove its tag associations
      },
      tag_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true, // Part of composite primary key
        references: {
          model: 'tags', // References the 'tags' table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If a tag is deleted, remove its product associations
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
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('product_tags');
  }
};
