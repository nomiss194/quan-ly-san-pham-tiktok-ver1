'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('products', { // Table name lowercase
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: { // Foreign key
        type: Sequelize.INTEGER,
        allowNull: false, // As per plan.md schema
        references: {
          model: 'users', // References the 'users' table (lowercase)
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Changed from SET NULL in model to CASCADE as per plan.md
      },
      url: {
        type: Sequelize.TEXT, // Changed from STRING to TEXT as per plan.md
        allowNull: false
      },
      image_url: {
        type: Sequelize.TEXT, // Changed from STRING to TEXT as per plan.md
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      purchased: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false // Explicitly set allowNull based on defaultValue
      },
      video_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false // Explicitly set allowNull based on defaultValue
      },
      deleted_at: { // For soft delete (paranoid: true)
        allowNull: true,
        type: Sequelize.DATE
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

    // Add index on user_id as suggested in plan.md
    await queryInterface.addIndex('products', ['user_id'], {
      name: 'idx_products_user_id' // Optional: specify index name
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove index first if needed, though dropping table handles it
    // await queryInterface.removeIndex('products', 'idx_products_user_id');
    await queryInterface.dropTable('products');
  }
};
