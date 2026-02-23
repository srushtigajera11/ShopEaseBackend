const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: Number,
      price: Number,
    },
  ],

  totalAmount: Number,

  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },

  isActive: { type: Boolean, default: true },
  isDelete: { type: Boolean, default: false },

}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;