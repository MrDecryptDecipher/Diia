const logger = require('./logger');

/**
 * Handle errors in API routes
 * @param {Error} error - The error object
 * @param {Object} res - Express response object
 * @param {string} context - Optional context for the error
 */
function handleError(error, res, context = '') {
  // Log the error with context
  const errorMessage = context ? `${context}: ${error.message}` : error.message;
  logger.error(errorMessage, {
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });

  // Determine the appropriate HTTP status code
  let statusCode = 500;
  let message = 'Internal server error';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable';
  } else if (error.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = 'Gateway timeout';
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle async errors in middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function with error handling
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function globalErrorHandler(err, req, res, next) {
  handleError(err, res, `${req.method} ${req.path}`);
}

/**
 * Create a custom error class
 * @param {string} name - Error name
 * @param {number} statusCode - HTTP status code
 * @returns {Function} - Custom error class
 */
function createError(name, statusCode = 500) {
  return class extends Error {
    constructor(message) {
      super(message);
      this.name = name;
      this.statusCode = statusCode;
    }
  };
}

// Common error classes
const ValidationError = createError('ValidationError', 400);
const NotFoundError = createError('NotFoundError', 404);
const UnauthorizedError = createError('UnauthorizedError', 401);
const ForbiddenError = createError('ForbiddenError', 403);

module.exports = {
  handleError,
  asyncHandler,
  globalErrorHandler,
  createError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError
};
