const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
  productName : {
    type : String,
    required :true
  },
  description :{
    type : String
  },
  price :{
    type:Number,
    required: true

  },
  totalQuantity: {
  type: Number,
  default: 0
},
isActive: { type: Boolean, default: true },
isDelete: { type: Boolean, default: false },

  shopkeeperId : {
    type: mongoose.Schema.Types.ObjectId,
    ref : 'User',
    required:true
  }
},{timestamps:true});
productSchema.pre("findOneAndDelete", function () {
  throw new Error("Hard delete not allowed");
});

productSchema.pre("deleteOne", function () {
  throw new Error("Hard delete not allowed");
});
module.exports = mongoose.model('Product',productSchema);