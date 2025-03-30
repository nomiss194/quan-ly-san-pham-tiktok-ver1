const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, productController.getAllProducts);
router.post('/', authMiddleware, productController.createProduct);
router.get('/trash', authMiddleware, productController.getTrash); // Moved before /:id
router.get('/:id', authMiddleware, productController.getProduct);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);
router.post('/:id/restore', authMiddleware, productController.restoreProduct);
router.delete('/:id/permanent', authMiddleware, productController.permanentDelete);

// Video Count and Logs
// router.post('/:id/videos', authMiddleware, productController.incrementVideoCount); // Removed - Deprecated
// router.put('/:id/videos', authMiddleware, productController.setVideoCount); // Removed - video_count is calculated automatically
router.post('/:id/video_logs', authMiddleware, productController.addVideoLog); // Add/Update daily log
router.get('/:id/video_logs', authMiddleware, productController.getVideoLogForDate); // Get log for specific date (using query ?date=YYYY-MM-DD)
router.get('/:id/video_logs/all', authMiddleware, productController.getVideoLogs); // Renamed and uncommented: Route to get all logs for a product


// Product Tag Associations
router.post('/:productId/tags', authMiddleware, productController.addProductTagAssociation);
router.delete('/:productId/tags/:tagId', authMiddleware, productController.removeProductTagAssociation);
module.exports = router;