'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tags', { // Table name lowercase
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
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

    // Add index on name as suggested in plan.md
    await queryInterface.addIndex('tags', ['name'], {
      name: 'idx_tags_name', // Optional: specify index name
      unique: true // Ensure the index reflects the unique constraint
    });
  },

  async down (queryInterface, Sequelize) {
    // await queryInterface.removeIndex('tags', 'idx_tags_name');
    await queryInterface.dropTable('tags');
  }
};
