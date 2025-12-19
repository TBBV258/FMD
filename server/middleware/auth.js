const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { createHttpError } = require('./errorHandler');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        createHttpError(401, 'You are not logged in! Please log in to get access.')
      );
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        createHttpError(401, 'The user belonging to this token no longer exists.')
      );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        createHttpError(401, 'User recently changed password! Please log in again.')
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        createHttpError(403, 'You do not have permission to perform this action')
      );
    }
    next();
  };
};

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// Check ownership of resource
exports.checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const doc = await model.findById(req.params.id);
      
      if (!doc) {
        return next(createHttpError(404, 'No document found with that ID'));
      }

      // If user is admin, grant access
      if (req.user.role === 'admin') return next();
      
      // Check if user is the owner
      if (doc.owner.toString() !== req.user.id && doc.foundBy?.toString() !== req.user.id) {
        return next(
          createHttpError(403, 'You do not have permission to perform this action')
        );
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
