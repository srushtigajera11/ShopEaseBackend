class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);

    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;