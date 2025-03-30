const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authMiddleware, (req, res) => {
  // In a real app, you would invalidate the token here
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;