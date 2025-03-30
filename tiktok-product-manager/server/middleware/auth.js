const jwt = require('jsonwebtoken');
// const { jwtSecret } = require('../config/auth'); // Removed - Use process.env.JWT_SECRET

module.exports = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  
  try {
    // Verify token using environment variable
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Attach user ID to the request object
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};