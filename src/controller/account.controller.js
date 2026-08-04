const accountModel = require("../models/account.models")
async function createAccount(req,res){
    const user =req.user
    const account=await accountModel.create({
        user:user._id
    })
    res.status(201).json({
        account
    })
}
async function getAccountDetails(req,res) {
    const user =req.user
    const accounts = await accountModel.find({user:user._id})
    res.status(200).json({
        accounts
    })
    
}
async function getAccountBalance(req,res) {
    const {accountId}= req.params;
    const account = await accountModel.findOne({
        _id:accountId,
        user : req.user._id
    })   
    if(!account){
        return res.status(400).json({message:"account not found"})

    } 
    const balance = await account.getBalance()
    return res.status(200).json({
        accountId:account._id,
        balance:balance
    })
}
module.exports={
    createAccount,getAccountDetails,getAccountBalance
}