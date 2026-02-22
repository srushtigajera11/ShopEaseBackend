const Batch = require("../models/batch.model");
const Product = require("../models/product.model");
const AppError = require("./AppError");

const sellFromBatches = async (productId, orderQty, session) => {
  let remainingOrderQty = orderQty;

  // find batches sorted by expiry
  const batches = await Batch.find({
    product: productId,
    remainingQty: { $gt: 0 },
    expiryDate: { $gte: new Date() },
    status: "active",
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

    // mark depleted
    if (batch.remainingQty === 0) {
      batch.status = "depleted";
    }

    await batch.save({ session });

    remainingOrderQty -= deductQty;
  }

  if (remainingOrderQty > 0) {
    throw new AppError("Insufficient stock", 400);
  }

  // update product stock
  await Product.findByIdAndUpdate(
    productId,
    { $inc: { totalQuantity: -orderQty } },
    { session }
  );
};

module.exports = sellFromBatches;