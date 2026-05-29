const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

const authenticateUser = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('Authentication required', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new AppError('User not found', 401));
    }

    if (user.passwordChangedAt && decoded.iat) {
      const changedAt = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedAt) {
        return next(new AppError('Password changed. Please login again', 401));
      }
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401));
    }
    next(err);
  }
};

const authorizeRoles = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};

module.exports = { authenticateUser, authorizeRoles };
