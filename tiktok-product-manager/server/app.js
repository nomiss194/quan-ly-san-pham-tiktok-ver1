const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const uploadRoutes = require('./routes/upload'); // Import upload routes

const app = express();

// Middleware
app.use(cors());

// IMPORTANT: Upload route must come BEFORE bodyParser for multipart/form-data
app.use('/api/upload', uploadRoutes);
// Middleware to handle potential Multer errors specifically for the upload route
app.use('/api/upload', (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading.
    console.error('[Multer Error]', err);
    return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
  } else if (err) {
    // An unknown error occurred when uploading.
    console.error('[Upload Route Error]', err);
    return res.status(500).json({ success: false, message: 'Unknown error during upload.' });
  }
  // Everything went fine, proceed to the next middleware/route handler
  next();
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from client
app.use(express.static(path.join(__dirname, '../client')));

// Serve static files from public directory (for uploads)
app.use(express.static(path.join(__dirname, 'public')));
// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/goals', require('./routes/goals'));

// Handle SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;