const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Batch = require("../models/batch.model");
const sendResponse = require("../utils/response");
const AppError = require("../utils/AppError");


/* CREATE PRODUCT (Shopkeeper)*/
exports.createProduct = async (req, res, next) => {
  try {
    const { productName, description, price } = req.body;

    if (!productName || !price) {
      throw new AppError("Product name and price are required", 400);
    }

    const exists = await Product.findOne({
      productName,
      shopkeeperId: req.user._id,
      isDelete: false,
    });

    if (exists) {
      throw new AppError("Product already exists", 400);
    }

    const product = await Product.create({
      productName,
      description,
      price,
      shopkeeperId: req.user._id,
    });

    return sendResponse(res, 201, "Product created successfully", product);
  } catch (err) {
    next(err);
  }
};

exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      sortKey,
      sortOrder,
    } = req.query;

    const match = {
      isActive: true,
      isDelete: false,
    };

    if (req.user.role === "shopkeeper") {
      match.shopkeeperId = req.user._id;
    }

    if (minPrice || maxPrice) {
      match.price = {};
      if (minPrice) match.price.$gte = Number(minPrice);
      if (maxPrice) match.price.$lte = Number(maxPrice);
    }

    const pipeline = [{ $match: match }];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { productName: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
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

    const products = await Product.aggregate(pipeline);

    return sendResponse(res, 200, "Products fetched", products);
  } catch (err) {
    next(err);
  }
};

/* GET PRODUCT BY ID*/
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
      isDelete: false,
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return sendResponse(res, 200, "Product details", product);
  } catch (err) {
    next(err);
  }
};

/* UPDATE PRODUCT (Shopkeeper) */
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
      isDelete: false,
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (product.shopkeeperId.toString() !== req.user._id.toString()) {
      throw new AppError("Unauthorized", 403);
    }

    const { productName, description, price } = req.body;

    if (productName) product.productName = productName;
    if (description) product.description = description;
    if (price) product.price = price;

    await product.save();

    return sendResponse(res, 200, "Product updated successfully", product);
  } catch (err) {
    next(err);
  }
};

/*  DELETE PRODUCT (Soft Delete) */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (product.shopkeeperId.toString() !== req.user._id.toString()) {
      throw new AppError("Unauthorized", 403);
    }

    const activeBatch = await Batch.exists({
      Product: product._id,
      remainingQty: { $gt: 0 },
      isDelete: false,
    });

    if (activeBatch) {
      throw new AppError(
        "Cannot delete product with remaining stock",
        400
      );
    }

    product.isActive = false;
    product.isDelete = true;

    await product.save();

    return sendResponse(res, 200, "Product deleted successfully");
  } catch (err) {
    next(err);
  }
};