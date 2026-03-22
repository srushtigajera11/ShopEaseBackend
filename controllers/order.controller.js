const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const sellFromBatches = require("../utils/sellFromBatches");
const sendResponse = require("../utils/response");
const AppError = require("../utils/AppError");


/* CREATE ORDER  (Customer) */
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
      const product = await Product.findOne({
        _id: item.productId,
        isActive: true,
        isDelete: false,
      }).session(session);

      if (!product) {
        throw new AppError("Product not found", 404);
      }

      if (item.quantity <= 0) {
        throw new AppError("Quantity must be greater than 0", 400);
      }

      // Deduct stock using FIFO batches
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
      [{
        customer: customerId,
        items: orderItems,
        totalAmount,
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return sendResponse(res, 201, "Order placed successfully", order[0]);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/* GET MY ORDERS (Customer) */
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, sortKey, sortOrder } = req.query;

    const match = {
      customer: req.user._id,
      isActive: true,
      isDelete: false,
    };

    if (status) {
      match.status = { $in: status.split(",") };
    }

    const pipeline = [
      { $match: match },

      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "products",
        },
      }
    ];

    // search
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { status: { $regex: search, $options: "i" } },
            { "products.productName": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // sorting
    const sortField = sortKey || "createdAt";
    const order = sortOrder === "asc" ? 1 : -1;
    pipeline.push({ $sort: { [sortField]: order } });

    // pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: Number(limit) });

    const orders = await Order.aggregate(pipeline);

    return sendResponse(res, 200, "My orders fetched", orders);

  } catch (err) {
    next(err);
  }
};

/* GET ALL ORDERS (Shopkeeper) */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, sortKey, sortOrder } = req.query;

    const products = await Product.find({
      shopkeeperId: req.user._id,
      isActive: true,
      isDelete: false,
    }).select("_id");

    const productIds = products.map(p => p._id);

    const match = {
      "items.product": { $in: productIds },
      isActive: true,
      isDelete: false,
    };

    if (status) {
      match.status = { $in: status.split(",") };
    }

    const pipeline = [
  { $match: match },

  {
    $lookup: {
      from: "users",
      localField: "customer",
      foreignField: "_id",
      as: "customer",
    },
  },
  { $unwind: "$customer" },

  {
    $lookup: {
      from: "products",
      localField: "items.product",
      foreignField: "_id",
      as: "products",
    },
  },
  {
    $project: {
      _id: 1,
      totalAmount: 1,
      status: 1,
      createdAt: 1,

      customerName: "$customer.name",
      customerEmail: "$customer.email",

      products: {
        $map: {
          input: "$products",
          as: "p",
          in: {
            productName: "$$p.productName",
            price: "$$p.price"
          }
        }
      }
    }
  }
];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { customerName: { $regex: search, $options: "i" } },
            { "products.productName": { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
          ],
        },
      });
    }


    const sortField = sortKey || "createdAt";
    const order = sortOrder === "asc" ? 1 : -1;
    pipeline.push({ $sort: { [sortField]: order } });

 
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: Number(limit) });

    const orders = await Order.aggregate(pipeline);

    return sendResponse(res, 200, "Orders fetched", orders);

  } catch (err) {
    next(err);
  }
};

/* GET ORDER BY ID*/
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
          isActive: true,
          isDelete: false,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "products",
        },
      },
    ]);

    if (!order.length) {
      return next(new AppError("Order not found", 404));
    }

    return sendResponse(res, 200, "Order details", order[0]);

  } catch (err) {
    next(err);
  }
};



/* UPDATE ORDER STATUS (Shopkeeper) */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["pending", "completed"].includes(status)) {
      throw new AppError("Invalid status", 400);
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    order.status = status;
    await order.save();

    return sendResponse(res, 200, "Order status updated", order);

  } catch (err) {
    next(err);
  }
};


/* cancel order (Customer) */
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      isDelete: false,
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      throw new AppError("Unauthorized", 403);
    }

    order.isActive = false;
    order.isDelete = true;

    await order.save();

    return sendResponse(res, 200, "Order cancelled successfully");

  } catch (err) {
    next(err);
  }
};