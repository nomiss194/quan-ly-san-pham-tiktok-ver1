const app = require('./app');
const { sequelize } = require('./models');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Test database connection and sync models
sequelize.authenticate()
  .then(() => {
    console.log('Database connected');
    // sequelize.sync() removed - Use migrations instead

    // Handle client-side routing
    app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, '../../client/index.html'));
    });

    app.get('/products', (req, res) => {
      res.sendFile(path.join(__dirname, '../../client/index.html'));
    });

    // Start the server only after successful authentication
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    // Optional: Exit the process if database connection fails on startup
    // process.exit(1);
  });