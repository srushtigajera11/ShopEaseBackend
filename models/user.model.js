const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email: {type: String,required: true,unique: true,lowercase: true,},
    password : {
        type:String,
        required:true
    },
    role:{
        type:String,
        enum :['shopkeeper','customer'],
        required:true,
        default : 'customer'
    },
    deliveryAddress : {type:String},
    refreshToken: {
            type: String
        },
        isActive: { type: Boolean, default: true },
isDelete: { type: Boolean, default: false }
},{timestamps:true});
module.exports = mongoose.model('User',userSchema);