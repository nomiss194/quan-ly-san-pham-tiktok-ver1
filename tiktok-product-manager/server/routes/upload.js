const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads/images');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save files to public/uploads/images
  },
  filename: function (req, file, cb) {
    // Create a unique filename (timestamp + random number + original extension)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter for image files
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: imageFilter });

// POST route for image upload
router.post('/image', upload.single('imageFile'), uploadController.uploadImage);

module.exports = router;