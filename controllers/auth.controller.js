const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const AppError = require('../utils/AppError');
const sendResponse = require("../utils/response");
const {generateAccessToken,generateRefreshToken} = require('../utils/token')

exports.register = async(req,res,next)=>{
    try{
        const {name,email,password,role,deliveryAddress}  = req.body;
        const existingUser = await User.findOne({ email })
         if (existingUser) {
      const error = new Error("Email already registered");
      error.statusCode = 400;
      return next(error);
    }
        const hash = await bcrypt.hash(password,10);
        const user = await User.create({name,email,password: hash,role,deliveryAddress});
         const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    return sendResponse(res, 201, "User registered successfully", createdUser);

    }catch(err){
        next(err);
    }
}

exports.refreshToken = async (req, res,next) => {
  try {
    const { refreshToken } = req.body;
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({
      _id: decoded.userId,
      refreshToken
    });

    if (!user) {
      return next(new AppError("User not found",404));
    }

    const newAccessToken = generateAccessToken(user._id);

    return sendResponse(res,200, "Access token refreshed", {
      accessToken: newAccessToken
    });

  } catch (err) {
    next(err);
    console.error(err);
  }
};


exports.login = async(req,res,next)=>{
    try{
        const {email,password} = req.body;
        const user = await User.findOne({email});
        if(!user){return next(new AppError("Invalid email or password", 401)); }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){return next(new AppError("Invalid email or password", 401));}
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        user.refreshToken = refreshToken;
        await user.save();
        
    user.password = undefined;
        return sendResponse(res,200,"Login successful",{
            accessToken,refreshToken,user
        });


    }catch(err){
        next(err);
    }
}

exports.logout = async (req, res, next) => {
  try {
    if (!req.user) {
      const error = new Error("Not authenticated");
      error.statusCode = 401;
      return next(error);
    }

    req.user.refreshToken = null;
    await req.user.save();

    return sendResponse(res, 200, "Logout successful");

  } catch (err) {
    next(err);
  }
};
