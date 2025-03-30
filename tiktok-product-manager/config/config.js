// Load environment variables from .env file located in the parent directory
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'postgres', // Default to postgres if not set
    migrationStorageTableName: "sequelize_meta" // Keep consistent table name
  },
  test: {
    // Configuration for test environment (can be different, e.g., separate test DB)
    username: process.env.TEST_DB_USER || process.env.DB_USER,
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.TEST_DB_NAME || `${process.env.DB_NAME}_test`, // Suggest using a separate test DB
    host: process.env.TEST_DB_HOST || process.env.DB_HOST,
    port: process.env.TEST_DB_PORT || process.env.DB_PORT,
    dialect: process.env.TEST_DB_DIALECT || 'postgres',
    logging: false, // Disable SQL logging for tests
    migrationStorageTableName: "sequelize_meta"
  },
  production: {
    // Use DATABASE_URL for production environments (common practice on hosting platforms like Heroku, Render)
    use_env_variable: "DATABASE_URL",
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true, // Enforce SSL for production
        rejectUnauthorized: false // Adjust based on your hosting provider's SSL requirements
      }
    },
    migrationStorageTableName: "sequelize_meta"
    // Optional fallback if DATABASE_URL is not set (uncomment and configure if needed)
    /*
    username: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    port: process.env.PROD_DB_PORT,
    */
  }
};