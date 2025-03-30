'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('Adding performance indexes...');
    // Indexes for Products table
    await queryInterface.addIndex('products', ['user_id'], { name: 'products_user_id_idx' });
    console.log('Added index on Products(user_id)');
    await queryInterface.addIndex('products', ['deleted_at'], { name: 'products_deleted_at_idx' }); // Important for soft deletes
    console.log('Added index on Products(deleted_at)');
    await queryInterface.addIndex('products', ['purchased'], { name: 'products_purchased_idx' });
    console.log('Added index on Products(purchased)');
    await queryInterface.addIndex('products', ['created_at'], { name: 'products_created_at_idx' });
    console.log('Added index on Products(created_at)');
    await queryInterface.addIndex('products', ['video_count'], { name: 'products_video_count_idx' });
    console.log('Added index on Products(video_count)');
    // Consider a composite index for common filtering
    await queryInterface.addIndex('products', ['user_id', 'deleted_at'], { name: 'products_user_id_deleted_at_idx' });
    console.log('Added composite index on Products(user_id, deleted_at)');

    // Index for VideoLogs table
    await queryInterface.addIndex('video_logs', ['product_id'], { name: 'videologs_product_id_idx' });
    console.log('Added index on VideoLogs(product_id)');

    // Indexes for ProductTags junction table (if not already primary/unique keys)
    // Check existing constraints before adding these. Assuming they might be needed for JOIN performance.
    try {
      // Check if index exists before adding - This is a basic check, might need more robust logic depending on DB
      const productTagsIndexes = await queryInterface.showIndex('product_tags');
      if (!productTagsIndexes.some(index => index.name === 'producttags_product_id_idx')) {
        await queryInterface.addIndex('product_tags', ['product_id'], { name: 'producttags_product_id_idx' });
        console.log('Added index on ProductTags(product_id)');
      } else {
        console.log('Index ProductTags(product_id) already exists.');
      }
      if (!productTagsIndexes.some(index => index.name === 'producttags_tag_id_idx')) {
        await queryInterface.addIndex('product_tags', ['tag_id'], { name: 'producttags_tag_id_idx' });
        console.log('Added index on ProductTags(tag_id)');
      } else {
         console.log('Index ProductTags(tag_id) already exists.');
      }
    } catch (error) {
        console.warn("Could not check or add indexes on ProductTags. This might happen if the table doesn't exist yet or due to permissions. Error:", error.message);
    }
    console.log('Finished adding performance indexes.');
  },

  async down (queryInterface, Sequelize) {
    console.log('Removing performance indexes...');
    await queryInterface.removeIndex('products', 'products_user_id_idx');
    console.log('Removed index on Products(user_id)');
    await queryInterface.removeIndex('products', 'products_deleted_at_idx');
    console.log('Removed index on Products(deleted_at)');
    await queryInterface.removeIndex('products', 'products_purchased_idx');
    console.log('Removed index on Products(purchased)');
    await queryInterface.removeIndex('products', 'products_created_at_idx');
    console.log('Removed index on Products(created_at)');
    await queryInterface.removeIndex('products', 'products_video_count_idx');
    console.log('Removed index on Products(video_count)');
    await queryInterface.removeIndex('products', 'products_user_id_deleted_at_idx');
    console.log('Removed composite index on Products(user_id, deleted_at)');

    await queryInterface.removeIndex('video_logs', 'videologs_product_id_idx');
    console.log('Removed index on VideoLogs(product_id)');

    // Only attempt removal if they likely exist
    try {
        await queryInterface.removeIndex('product_tags', 'producttags_product_id_idx');
        console.log('Removed index on ProductTags(product_id)');
    } catch (error) {
        console.warn("Could not remove index 'producttags_product_id_idx'. It might not exist.", error.message);
    }
     try {
        await queryInterface.removeIndex('product_tags', 'producttags_tag_id_idx');
        console.log('Removed index on ProductTags(tag_id)');
    } catch (error) {
        console.warn("Could not remove index 'producttags_tag_id_idx'. It might not exist.", error.message);
    }
    console.log('Finished removing performance indexes.');
  }
};
