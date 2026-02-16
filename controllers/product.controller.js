const Product = require('../models/product.model'); 
const sendResponse  = require('../utils/response');   
const AppError = require('../utils/AppError');
const { response } = require('express');
exports.createProduct = async (req, res, next) => {
    try {
        //check for duplicate product name for the same shopkeeper
        const {productName,description,price,stock} = req.body;
        const product = await Product.create({productName,description,price,stock,shopkeeperId:req.user._id});
        return sendResponse(res,201,"Product created successfully",product);
    }catch(err){
        next(err);
    }
}

exports.getAllProducts = async(req,res,next)=>{
    try{
        const products = await Product.find();
        return sendResponse(res,200,"products fetched successfully",products);
    }catch(err){
        next(err);
    }
}

exports.getProductById = async(req,res,next)=>{
    try{
        const product = await Product.findById(req.params.id);
        if(!product){
          return next(new AppError("Product not found", 404)); 
        }
        return sendResponse(res,200,"Product fetched successfully",product);
    }catch(err){
        next(err);
    }
}

exports.updateProduct = async(req,res,next)=>{
    try{
        const {productName,description,price,stock} = req.body;
        const product = await Product.findById(req.params.id);
        if(!product){
          return next(new AppError("Product not found", 404)); 
        }
        if(product.shopkeeperId.toString() !== req.user._id.toString()){
            return next(new AppError("Unauthorized", 403)); 
        }
        product.productName = productName || product.productName;
        product.description = description || product.description;
        product.price = price || product.price;
        product.stock = stock || product.stock;
        await product.save();
        return sendResponse(res,200,"Product updated successfully",product);
    }catch(err){
        next(err);
    }
}

exports.deleteProduct = async(req,res,next)=>{
    try{
       const product = await Product.findById(req.params.id);
    if(!product) return next(new AppError("Product not found",404));

    if(product.shopkeeperId.toString() !== req.user._id.toString()){
    return next(new AppError("Unauthorized",403));
    }

    await product.deleteOne();

        return sendResponse(res,200,"Product deleted successfully",null);
    }catch(err){
        next(err);
    }
}
exports.updateStock = async(req,res,next)=>{
    try{
        const {stock} = req.body;
        const product = await Product.findById(req.params.id);
        if(!product){
            return next(new AppError("Product not found", 404));
        }
        if(product.shopkeeperId.toString() !== req.user._id.toString()){
            return next(new AppError("Unauthorized", 403));
        }
         product.stock += stock;
        await product.save();
        return sendResponse(res,200,"Stock updated successfully",product);
    }catch(err){
        next(err);
    }
}