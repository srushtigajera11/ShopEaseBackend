const cron = require("node-cron");
const Batch = require("../models/batch.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const sendEmail = require("../utils/sendEmail");

cron.schedule("0 0 * * *", async () => {
  console.log("Running expiry cleanup job...");

  try {
    const today = new Date();

    // find expired batches
    const expiredBatches = await Batch.find({
      expiryDate: { $lt: today },
      remainingQty: { $gt: 0 },
      status: "active",
    });

    if (expiredBatches.length === 0) {
      console.log("No expired batches found.");
      return;
    }

    for (const batch of expiredBatches) {
  const expiredQty = batch.remainingQty;

  const product = await Product.findById(batch.product);
  const shopkeeper = await User.findById(batch.shopkeeper);

  // update product stock
  await Product.findByIdAndUpdate(batch.product, {
    $inc: { totalQuantity: -expiredQty },
  });

  // mark expired
  batch.status = "expired";
  batch.remainingQty = 0;
  await batch.save();

  // send email
  const message = `
Product: ${product.name}
Expired Quantity: ${expiredQty}
Expiry Date: ${batch.expiryDate.toDateString()}
Remaining Stock: ${product.totalQuantity - expiredQty}
`;

  await sendEmail(
    shopkeeper.email,
    "Expired Stock Alert",
    message
  );

  console.log(`Email sent for expired batch of ${product.name}`);
}

    console.log("Expiry cleanup completed.");
  } catch (error) {
    console.error("Expiry job error:", error.message);
  }
});