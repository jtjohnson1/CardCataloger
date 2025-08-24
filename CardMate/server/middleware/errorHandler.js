const errorHandler = (err, req, res, next) => {
  console.error('=== ERROR HANDLER ===');
  console.error('Error occurred:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  console.error('Request body keys:', Object.keys(req.body || {}));
  console.error('=== END ERROR ===');

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error in middleware:', error);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // File system errors
  if (err.code === 'ENOENT') {
    const message = 'File or directory not found';
    error = { message, statusCode: 404 };
  }

  if (err.code === 'EACCES') {
    const message = 'Permission denied';
    error = { message, statusCode: 403 };
  }

  if (err.code === 'EISDIR') {
    const message = 'Expected file but found directory';
    error = { message, statusCode: 400 };
  }

  // Image processing errors
  if (err.message && err.message.includes('image')) {
    const message = 'Image processing failed';
    error = { message, statusCode: 400 };
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError') {
    const message = 'Database connection failed';
    error = { message, statusCode: 503 };
  }

  if (err.name === 'MongoTimeoutError') {
    const message = 'Database operation timed out';
    error = { message, statusCode: 503 };
  }

  // AI/ML service errors
  if (err.message && err.message.includes('AI') || err.message && err.message.includes('model')) {
    const message = 'AI processing service unavailable';
    error = { message, statusCode: 503 };
  }

  // Card processing specific errors
  if (err.message && err.message.includes('card')) {
    const message = 'Card processing failed';
    error = { message, statusCode: 400 };
  }

  // Directory scanning errors
  if (err.message && err.message.includes('directory')) {
    const message = 'Directory scanning failed';
    error = { message, statusCode: 400 };
  }

  // Ensure we always return JSON
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;