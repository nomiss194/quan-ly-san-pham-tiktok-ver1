const path = require('path');

exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded.' });
  }

  try {
    // Construct the URL path relative to the server root
    // Assuming 'public' is served statically
    const imageUrl = `/uploads/images/${req.file.filename}`;

    res.status(200).json({ success: true, imageUrl: imageUrl });
  } catch (error) {
    console.error("Error processing uploaded image:", error);
    res.status(500).json({ success: false, message: 'Error processing image upload.' });
  }
};