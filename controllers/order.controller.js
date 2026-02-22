const Order = require("../models/order.model");
const Product = require("../models/product.model");
const mongoose = require("mongoose");
const sendResponse = require('../utils/response');
const AppError = require('../utils/AppError');
const sellFromBatches = require("../utils/sellFromBatches");

//create order
exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items } = req.body;
    const customerId = req.user._id;

    if (!items || items.length === 0) {
      throw new AppError("Order items required", 400);
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        throw new AppError("Product not found", 404);
      }

      // ⭐ Deduct from batches using FIFO expiry
      await sellFromBatches(product._id, item.quantity, session);

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const order = await Order.create(
      [
        {
          customer: customerId,
          items: orderItems,
          totalAmount,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: order[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};


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