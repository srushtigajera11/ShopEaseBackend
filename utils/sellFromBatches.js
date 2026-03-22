const Batch = require("../models/batch.model");
const Product = require("../models/product.model");
const AppError = require("./AppError");

const sellFromBatches = async (productId, orderQty, session) => {
  let remainingOrderQty = orderQty;
  const batches = await Batch.find({
    Product: productId,          
    remainingQty: { $gt: 0 },
    expiryDate: { $gte: new Date() },
    isDelete: false,             
    isActive: true,
  })
    .sort({ expiryDate: 1 })
    .session(session);

  if (!batches.length) {
    throw new AppError("Product out of stock", 400);
  }

  for (const batch of batches) {
    if (remainingOrderQty <= 0) break;

    const deductQty = Math.min(batch.remainingQty, remainingOrderQty);

    batch.remainingQty -= deductQty;

    await batch.save({ session });

    remainingOrderQty -= deductQty;
  }

  if (remainingOrderQty > 0) {
    throw new AppError("Insufficient stock", 400);
  }

  await Product.findByIdAndUpdate(
    productId,
    { $inc: { totalQuantity: -orderQty } },
    { session }
  );
};

module.exports = sellFromBatches;