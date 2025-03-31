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
    // use_env_variable: "DATABASE_URL",
 // Comment out or remove this line
    dialect: 'postgres',
    // Remove dialectOptions for internal Docker network connection (usually no SSL needed)
    // dialectOptions: {
    //   ssl: {
    //     require: true,
    //     rejectUnauthorized: false
    //   }
    // },
    migrationStorageTableName: "sequelize_meta"
, // <-- Thêm dấu phẩy ở đây
    // Optional fallback if DATABASE_URL is not set (uncomment and configure if needed)
    // Add individual environment variables like in development
    username: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    port: process.env.PROD_DB_PORT,
    // Use the same variables as defined in .env.docker for consistency
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST, // This should be 'db' from .env.docker
    port: process.env.DB_PORT,
  }
};