'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('tags', 'color', { // Add 'color' column to 'tags' table
      type: Sequelize.STRING(7), // For hex color codes like #RRGGBB
      allowNull: true, // Allow tags without a specific color initially
      defaultValue: '#cccccc' // Optional: Provide a default color
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('tags', 'color');
  }
};
