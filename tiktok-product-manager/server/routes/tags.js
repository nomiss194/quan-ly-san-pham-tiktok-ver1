const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, tagController.getAllTags);
router.post('/', authMiddleware, tagController.createTag);
router.put('/:id', authMiddleware, tagController.updateTag); // Added route for updating tag
router.delete('/:id', authMiddleware, tagController.deleteTag);

module.exports = router;