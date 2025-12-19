const createHttpError = require('http-errors');
const { validationResult } = require('express-validator');

/**
 * Custom error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Handle validation errors
  if (err.status === 400 && err.errors) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.errors,
    });
  }

  // Handle JWT authentication errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed. Please log in again.',
    });
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      status: 'error',
      message: `${field} already exists`,
      field,
    });
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors,
    });
  }

  // Handle 404 errors
  if (err.status === 404) {
    return res.status(404).json({
      status: 'error',
      message: err.message || 'Resource not found',
    });
  }

  // Handle other HTTP errors
  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({
      status: 'error',
      message: err.message,
    });
  }

  // Handle unexpected errors
  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Something went wrong. Please try again later.';

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 handler middleware
 */
const notFoundHandler = (req, res, next) => {
  next(createHttpError(404, `Not Found - ${req.originalUrl}`));
};

/**
 * Async handler to wrap async/await route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createHttpError,
};
