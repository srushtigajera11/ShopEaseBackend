const mongoose = require('mongoose');
const batchSchema = new mongoose.Schema({
    Product :{
        type : mongoose.Schema.Types.ObjectId,
    ref : 'Product',
    required : true
    },

    shopkeeper :{
        type : mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    quantity : {
        type : Number,
        required: true,
        min : 1
    },
    remainingQty  : {
        type : Number,
        required : true,
        min : 0
    },
    expiryDate  : {
        type : Date,
        required : true
    },
    status : {
        type : String,
        enum : ['active','expired','depleted'],
        default :'active'
    },
},{timestamps : true});
batchSchema.index({ product: 1, expiryDate: 1 });

module.exports = mongoose.model('Batch',batchSchema);