const sendResponse = require("../utils/response");

module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server Error";
  let errors = err.errors || null;

  // 🔴 Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // 🔴 Duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = `Duplicate value entered for ${Object.keys(err.keyValue)}`;
  }

  // 🔴 Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map(e => e.message);
  }

  // 🔴 JWT errors (if using auth)
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  console.error("ERROR:", err);

  return sendResponse(res, statusCode, message, errors, null, false);
};