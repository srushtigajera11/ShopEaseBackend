const Batch = require('../models/batch.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

exports.createBatch = async(req,res,next)=>{
    try{
        const {productId , quantity,expiryDate} = req.body;
        const shopkeeperId =  req.user._id;

        if(!productId || !quantity || !expiryDate){
            return next(new AppError('Please provide all required fields',400));
        }
        if(quantity <= 0){
            return next(new AppError('Quantity must be greater than zero',400));
        }
        const product =  await  Product.findOne({
            _id : productId,
            shopkeeperId : shopkeeperId,
        }).session(session);
        if(!product){
            return next(new AppError('Product not Found',404));
        }

        const batch = new Batch.create([{
            product : productId,
            shopkeeper : shopkeeperId,
            quantity,
            remainingQty : quantity,
            expiryDate
        },],{session});

        product.totalQuantity += quantity;
        await product.save({session});

        await session.commitTransaction();

        return sendResponse(res,201,true,'Batch created successfully',batch[0]);
    }catch(error){
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
}