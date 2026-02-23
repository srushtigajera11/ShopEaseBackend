const cron = require("node-cron");
const Batch = require("../models/batch.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const sendEmail = require("../utils/sendEmail");


let isJobRunning = false; // prevents overlapping runs

cron.schedule("0 0 * * *", async () => {
  if (isJobRunning) return;
  isJobRunning = true;

  console.log("⏱ Running expiry cleanup job...");

  try {
    const now = new Date();

    // find expired batches
    const expiredBatches = await Batch.find({
      expiryDate: { $lt: now },
      remainingQty: { $gt: 0 },
      status: "active",
    });

    if (!expiredBatches.length) {
      console.log("✔ No expired batches found.");
      isJobRunning = false;
      return;
    }

    console.log(`⚠ Found ${expiredBatches.length} expired batch(es)`);

    for (const batch of expiredBatches) {
      try {
        const expiredQty = batch.remainingQty;

        const product = await Product.findById(batch.product);
        const shopkeeper = await User.findById(batch.shopkeeper);

        if (!product || !shopkeeper) {
          console.log(`⚠ Skipping batch ${batch._id} (missing product/user)`);
          continue;
        }

        console.log(`➡ Expiring batch ${batch._id} | Product: ${product.name}`);

        // update product stock
        await Product.findByIdAndUpdate(batch.product, {
          $inc: { totalQuantity: -expiredQty },
        });

        // mark batch expired
        batch.status = "expired";
        batch.remainingQty = 0;
        await batch.save();

        // get updated product stock
        const updatedProduct = await Product.findById(batch.product);
        // 📧 EMAIL NOTIFICATION
        const message = `
            Product: ${product.productName}
            Expired Quantity: ${expiredQty}
            Expiry Date: ${batch.expiryDate.toDateString()}
            Remaining Stock: ${updatedProduct.totalQuantity}
                    `;

        try {
          await sendEmail(
            shopkeeper.email,
            "Expired Stock Alert",
            message
          );
          console.log("📧 Email sent to shopkeeper");
        } catch (err) {
          console.log("❌ Email failed:", err.message);
        }

      } catch (batchError) {
        console.log("❌ Error processing batch:", batch._id, batchError.message);
      }
    }

    console.log("✅ Expiry cleanup completed.");
  } catch (error) {
    console.error("❌ Expiry job error:", error.message);
  }

  isJobRunning = false;
});