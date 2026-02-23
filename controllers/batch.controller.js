const mongoose = require("mongoose");
const Batch = require("../models/batch.model");
const Product = require("../models/product.model");
const sendResponse = require("../utils/response");
const AppError = require("../utils/AppError");


/* =========================================
   CREATE BATCH
========================================= */
exports.createBatch = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, quantity, expiryDate } = req.body;
    const shopkeeperId = req.user._id;

    if (!productId || !quantity || !expiryDate) {
      throw new AppError("Please provide all required fields", 400);
    }

    if (quantity <= 0) {
      throw new AppError("Quantity must be greater than zero", 400);
    }

    const product = await Product.findOne({
      _id: productId,
      shopkeeperId,
      isActive: true,
      isDelete: false,
    }).session(session);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const batch = await Batch.create(
      [{
        Product: productId,
        shopkeeper: shopkeeperId,
        quantity,
        remainingQty: quantity,
        expiryDate,
      }],
      { session }
    );

    // update product total quantity
    product.totalQuantity += quantity;
    await product.save({ session });

    await session.commitTransaction();
    session.endSession();

    return sendResponse(res, 201, "Batch created successfully", batch[0]);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};



/* =========================================
   GET ALL BATCHES (Shopkeeper)
========================================= */
exports.getAllBatches = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      product,
      sortKey,
      sortOrder,
      lowStock,
      expiringSoon
    } = req.query;

    const match = {
      shopkeeper: req.user._id,
      isActive: true,
      isDelete: false,
    };

    // filter by product
    if (product) {
      match.Product = { $in: product.split(",") };
    }

    // low stock filter
    if (lowStock === "true") {
      match.remainingQty = { $lte: 5 };
    }

    const pipeline = [
      { $match: match },

      {
        $lookup: {
          from: "products",
          localField: "Product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ];

    // expiring soon filter (within 7 days)
    if (expiringSoon === "true") {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      pipeline.push({
        $match: {
          expiryDate: { $gte: today, $lte: nextWeek },
        },
      });
    }

    // search by product name
    if (search) {
      pipeline.push({
        $match: {
          "product.productName": {
            $regex: search,
            $options: "i",
          },
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

    const batches = await Batch.aggregate(pipeline);

    return sendResponse(res, 200, "Batches fetched", batches);

  } catch (err) {
    next(err);
  }
};



/* =========================================
   GET BATCH BY ID
========================================= */
exports.getBatchById = async (req, res, next) => {
  try {
    const batch = await Batch.aggregate([
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
          localField: "Product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ]);

    if (!batch.length) {
      return next(new AppError("Batch not found", 404));
    }

    return sendResponse(res, 200, "Batch details", batch[0]);

  } catch (err) {
    next(err);
  }
};



/* =========================================
   DELETE BATCH (Soft Delete)
========================================= */
exports.deleteBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.id,
      shopkeeper: req.user._id,
      isDelete: false,
    });

    if (!batch) {
      throw new AppError("Batch not found", 404);
    }

    // prevent delete if stock still available
    if (batch.remainingQty > 0) {
      throw new AppError(
        "Cannot delete batch with remaining stock",
        400
      );
    }

    batch.isDelete = true;
    batch.isActive = false;

    await batch.save();

    return sendResponse(res, 200, "Batch deleted successfully");

  } catch (err) {
    next(err);
  }
};