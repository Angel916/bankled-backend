const mongoose = require("mongoose")

const ledgerSchema = new  mongoose.Schema({
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"ledger must be associated with account"],
        index:true,
        immutable:true

    },
    amount:{
        type:Number,
        required:true,
        immutable:true
    },
    transaction:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transaction",
        required:[true,"ledger must associated with a transaction "],
        index:true,
        immutable:true
    },
    type:{
        type:String,
        enum:{
            values:["CREDIT","DEBIT"],
            message:"type can either be debit or credit "
        },
        required:[true,"type is required"],
        immutable:true
    }
})

function preventLedgerModification (){
    throw new Error("ledger entries cannot be modififed or deleted ")
}
ledgerSchema.pre('findOneAndDelete',preventLedgerModification)
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("remove", preventLedgerModification);
ledgerSchema.pre("findOneAndRemove", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);

const ledgerModel = mongoose.model("ledger",ledgerSchema)
module.exports=ledgerModel