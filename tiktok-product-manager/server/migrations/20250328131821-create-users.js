'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users', { // Table name should be lowercase 'users'
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true // Default is true, but explicit for clarity
      },
      avatar_url: {
        type: Sequelize.TEXT, // Matches model and plan.md
        allowNull: true
      },
      created_at: { // Matches underscored: true in model
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW // Sequelize handles this well
      },
      updated_at: { // Matches underscored: true in model
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW // Sequelize handles this well
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
