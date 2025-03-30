'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
// Determine the environment (default to 'development' if not set)
const env = process.env.NODE_ENV || 'development';
// Load the configuration based on the environment
const config = require(path.join(__dirname, '../../config/config.js'))[env];
const db = {};

let sequelize;
// Initialize Sequelize based on the configuration
if (config.use_env_variable) {
  // Use DATABASE_URL environment variable if specified (common for production)
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Otherwise, use individual database connection parameters
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Load all model files from the current directory
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 && // Exclude hidden files
      file !== basename &&       // Exclude this index file
      file.slice(-3) === '.js' && // Include only .js files
      file.indexOf('.test.js') === -1 // Exclude test files
    );
  })
  .forEach(file => {
    // Import the model definition
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model; // Add the model to the db object
  });

// Set up associations between models if defined
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Export the sequelize instance and the models
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;