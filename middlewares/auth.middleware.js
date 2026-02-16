const jwt = require("jsonwebtoken");
const User = require('../models/user.model');

const protect = async (req, res, next) => {
  try {
 let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const error = new Error("Not authorized, token missing");
      error.statusCode = 401;
      return next(error);
    }
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 401;
      return next(error);
    }

    req.user = user; // attach user to request
    next();
  } catch (err) {
   err.statusCode = 401;
   next(err);
  }
};
const authorize = (...roles) =>{
  return (req,res,next)=>{
    if(!roles.includes(req.user.role)){
      const error = new Error("Access Denied");
      error.statusCode = 403;
      return next(error);
    }
    next();
  }
}

module.exports = {protect,authorize};