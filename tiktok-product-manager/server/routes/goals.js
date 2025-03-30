const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, goalController.getGoals);
router.get('/stats', authMiddleware, goalController.getGoalStats); // Moved before /:id and removed duplicate
router.get('/:id', authMiddleware, goalController.getGoalById);
router.post('/', authMiddleware, goalController.createOrUpdateGoal);
// router.get('/stats', authMiddleware, goalController.getGoalStats); // Removed duplicate line
router.delete('/:id', authMiddleware, goalController.deleteGoal);

module.exports = router;