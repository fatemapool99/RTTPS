/**
 * RTTPS - Authentication & Authorization Middleware
 * Verifies JWT tokens and enforces role-based access control.
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'rttps_production_super_secret_jwt_key_2026';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Attach user to request object (excluding password)
    req.user = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferredStation: user.preferredStation
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or has expired. Please log in again.'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user?.role || 'none'}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
  JWT_SECRET
};
