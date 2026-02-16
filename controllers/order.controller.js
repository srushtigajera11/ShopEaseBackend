const Order = require("../models/order.model");
const Product = require("../models/product.model");
const mongoose = require("mongoose");
const sendResponse = require('../utils/response');
const AppError = require('../utils/AppError');

//create order
exports.createOrder = async (req,res,next)=>{
  const session = await mongoose.startSession();
  session.startTransaction();

  try{
    const { items } = req.body;

    if(!items || items.length === 0){
      return next(new AppError("Order items required",400));
    }

    let totalAmount = 0;
    const orderItems = [];

    for(const item of items){

      if(item.quantity <= 0){
        return next(new AppError("Quantity must be greater than zero",400));
      }

      const product = await Product.findById(item.productId).session(session);

      if(!product){
        return next(new AppError("Product not found",404));
      }

      if(product.stock < item.quantity){
        return next(new AppError(`Insufficient stock for ${product.productName}`,400));
      }

      // deduct stock
      product.stock -= item.quantity;
      await product.save({session});

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product._id,
        price: product.price,
        quantity: item.quantity
      });
    }

    const order = await Order.create([{
      customerId: req.user._id,
      items: orderItems,
      totalAmount
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return sendResponse(res,201,"Order placed successfully",order[0]);

  }catch(err){
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}


//get my orderS(customer)
exports.getMyOrders = async(req,res,next)=>{
    try{
        const orders = await Order.find({customerId:req.user._id});
        return sendResponse(res,200,"My Orders",orders);
    }catch(err){
        next(err);
    }
}

//get all orders (shopkeeper)
exports.getAllOrders = async (req, res, next) => {
  try {

    // find products owned by this shopkeeper
    const products = await Product.find({ shopkeeperId: req.user._id }).select('_id');

    const productIds = products.map(p => p._id);

    // find orders containing those products
    const orders = await Order.find({
      "items.productId": { $in: productIds }
    })
    .populate("customerId", "name email")
    .populate("items.productId", "productName price");

    return sendResponse(res, 200, "Shopkeeper Orders", orders);

  } catch (err) {
    next(err);
  }
};


exports.getOrderById = async(req,res,next)=>{
    try{
        const order = await Order.findById(req.params.id);
        if(!order){
            return next(new AppError("order not Found",404));
        }
        return sendResponse(res,200,"Order Details",order);
    }catch(err){
        next(err);
    }
}

exports.updateOrderStatus = async(req,res,next)=>{
    try{
        const {status} = req.body;
        if(!["pending","completed"].includes(status)){
        return next(new AppError("Invalid status",400));
        }
        const order = await Order.findById(req.params.id);
        if(!order){
            return next(new AppError("order not found",404));
        }
        order.status = status;
        await order.save();
        return sendResponse(res,200,"Order Status Updated",order);
    
    }catch(err){
        next(err);
    }
}