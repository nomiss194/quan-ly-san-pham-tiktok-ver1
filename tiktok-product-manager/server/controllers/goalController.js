const { Goal, CategoryGoal, Tag } = require('../models');

exports.getGoals = async (req, res) => {
  try {
    const userId = req.userId;
    const goals = await Goal.findAll({
      where: { user_id: userId },
      include: [{
        model: CategoryGoal,
        include: [Tag]
      }],
      order: [['year', 'DESC'], ['month', 'DESC']] // Order by most recent
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getGoalById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const goal = await Goal.findOne({
      where: { id, user_id: userId },
      include: [{
        model: CategoryGoal,
        include: [Tag]
      }]
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createOrUpdateGoal = async (req, res) => {
  try {
    // If ID is present, it's an update, otherwise it's create (handled by upsert)
    const { id, month, year, product_goal, video_goal, category_goals } = req.body;
    const userId = req.userId;
    console.log(`[createOrUpdateGoal] Received userId from token: ${userId}`); // DEBUG

    // Use upsert to handle both create and update based on unique constraint
    const [goal, created] = await Goal.upsert({
      id: id || undefined, // Pass id only if updating
      user_id: userId,
      month,
      year,
      product_goal,
      video_goal
    }, {
      returning: true,
      // conflictFields: ['user_id', 'month', 'year'] // Use default PK or unique constraint
    });

    // If updating, first remove old category goals for simplicity
    if (!created && id) {
        await CategoryGoal.destroy({ where: { goal_id: goal.id } });
    }

    // Handle category goals (add new ones)
    if (category_goals && category_goals.length > 0) {
      const categoryGoalPromises = category_goals.map(async (cg) => {
        // Find or create the tag first
        const [tagInstance] = await Tag.findOrCreate({
          where: { name: cg.tag_name },
          defaults: { name: cg.tag_name }
        });
        // Then create the CategoryGoal association
        return CategoryGoal.create({
          goal_id: goal.id,
          tag_id: tagInstance.id,
          product_goal: cg.product_goal
        });
      });
      await Promise.all(categoryGoalPromises);
    }

    // Fetch the final goal with associations to return
    const finalGoal = await Goal.findByPk(goal.id, {
      include: [{
        model: CategoryGoal,
        include: [Tag]
      }]
    });

    res.status(created ? 201 : 200).json(finalGoal);
  } catch (error) {
    console.error("Error in createOrUpdateGoal:", error); // Log detailed error
    res.status(500).json({ error: error.message });
  }
};


const { Op, fn, col, literal } = require('sequelize'); // Import necessary operators/functions
const { Product, VideoLog } = require('../models'); // Import other needed models

exports.getGoalStats = async (req, res) => {
  try {
    const userId = req.userId;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year query parameters are required' });
    }

    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);

    // 1. Find the goal for the specified month/year
    const goal = await Goal.findOne({
      where: { user_id: userId, month: targetMonth, year: targetYear },
      include: [{ model: CategoryGoal, include: [Tag] }] // Include category goals if needed later
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found for the specified month and year' });
    }

    // 2. Calculate actual products purchased in the target month/year
    // We need to define the start and end of the month precisely
    const startDate = new Date(targetYear, targetMonth - 1, 1); // Month is 0-indexed
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999); // Last day, end of day

    const actualProductsPurchased = await Product.count({
      where: {
        user_id: userId,
        purchased: true,
        updated_at: { // Assuming updated_at reflects purchase date change
          [Op.between]: [startDate, endDate]
        }
      }
    });

    // 3. Calculate actual videos logged in the target month/year
    // Step 3.1: Get product IDs for the user
    const userProducts = await Product.findAll({
        where: { user_id: userId },
        attributes: ['id'], // Only need the IDs
        raw: true // Get plain objects
    });
    const userProductIds = userProducts.map(p => p.id);

    // Step 3.2: Sum video logs for those product IDs within the date range
    const actualVideosLogged = await VideoLog.sum('count', {
       where: {
         product_id: { [Op.in]: userProductIds }, // Filter by user's product IDs
         date: {
           [Op.between]: [
             `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`, // Start of month YYYY-MM-DD
             `${targetYear}-${String(targetMonth).padStart(2, '0')}-${new Date(targetYear, targetMonth, 0).getDate()}` // End of month YYYY-MM-DD
           ]
         }
       }
       // No include needed here anymore
    });


    // 4. Prepare the response
    const stats = {
      goal: {
        product_goal: goal.product_goal,
        video_goal: goal.video_goal,
        month: goal.month,
        year: goal.year,
        category_goals: goal.CategoryGoals // Include category goals details
      },
      actual: {
        products_purchased: actualProductsPurchased || 0,
        videos_logged: actualVideosLogged || 0
      },
      progress: {
         product_progress: goal.product_goal > 0 ? ((actualProductsPurchased || 0) / goal.product_goal) * 100 : 0,
         video_progress: goal.video_goal > 0 ? ((actualVideosLogged || 0) / goal.video_goal) * 100 : 0
      }
      // TODO: Add category-specific progress calculation if needed
    };

    res.json(stats);

  } catch (error) {
    console.error("Error fetching goal stats:", error);
    res.status(500).json({ error: error.message });
  }
};


exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const goal = await Goal.findOne({
      where: { id, user_id: userId }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Delete associated CategoryGoals first
    await CategoryGoal.destroy({ where: { goal_id: id } });

    await goal.destroy();

    res.status(204).send(); // No content on successful delete
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};