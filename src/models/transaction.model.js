const mongoose = require("mongoose")
const transactionSchema = new mongoose.Schema({
    fromAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"transaction must be associated with a fromAccount"],
        index:true
    },
    toAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"transaction must have a toAccount"],
        index:true
    },
    status:{
        type:String,
        enum:{
            values:["PENDING","COMPLETED","FAILED","REVERSED"],
            message:"statuc can either be pending,completed , failed or reversed"
        },
        default:"PENDING"
    },
    amount:{
        type:Number,
        required:[true,"amount is required"],
        min:[0,"amount cant be negative"]
    },
    idempotencyKey:{
        type:String,
        required:[true,"idempotency key is required"],
        unique:true,
        index:true
    }
},{timestamps:true

})
const transactionModel = mongoose.model("transaction",transactionSchema)
module.exports=transactionModel