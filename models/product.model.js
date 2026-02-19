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
  stock:{
    type:Number,
    required: true
  },
  shopkeeperId : {
    type: mongoose.Schema.Types.ObjectId,
    ref : 'User',
    required:true
  }
},{timestamps:true});
module.exports = mongoose.model('Product',productSchema);