const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.models");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

/**
 * -Create a new transaction
 * 1. validate request
 * 2.validate idempotency key
 * 3.check account status
 * 4.derive sender balance from ledger
 * 5.create transaction (pending)
 * 6. create DEBIT ledger entry
 * 7.create CREDIT ledger entry
 * 8. mark transaction completed
 * 9. commit mongodb session
 * 10.send email notification
 */
async function createTransaction(req, res) {
  /**
   * 1.validate request
   */
  const { toAccount, fromAccount, amount, idempotencyKey } = req.body;
  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: " fromAccount ,toAccount , idempotencyKey or amount is missing ",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });
  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });
  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "invalid fromaccount or toaccount ",
    });
  }
  /**
   * 2.  validate idempotency key
   */
  const isTransactionAlreadyExist = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });
  if (isTransactionAlreadyExist) {
    if (isTransactionAlreadyExist.status === "COMPLETED") {
      return res.status(200).json({
        message: "transaction is completed ",
      });
    }
    if (isTransactionAlreadyExist.status === "PENDING") {
      return res
        .status(200)
        .json({ message: "transaction is still processing" });
    }
    if (isTransactionAlreadyExist.status === "FAILED") {
      return res
        .status(200)
        .json({ message: "transaction processing failed , please retry " });
    }
    if (isTransactionAlreadyExist.status === "REVERSED") {
      return res
        .status(200)
        .json({ message: "transaction was reversed please retry " });
    }
  }
  /**
   * 3. check account status
   */
  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message:
        "both fromAccount and toAccount must be active to prcoess the transaction ",
    });
  }
  /**
   * 4. dervide sender balance from the ledger
   */
  const balance = await fromUserAccount.getBalance();
  if (balance < amount) {
    return res.status(400).json({
      message: `insufficient balance . Current balance is ${balance} . Requested amount is ${amount} `,
    });
  }
  let transaction;
  const session = await mongoose.startSession();
  try {
    /**
     * 5. create transaction (pending)
     */
    session.startTransaction();
    transaction = (
      await transactionModel.create(
        [
          {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING",
          },
        ],
        { session },
      )
    )[0];

    await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session },
    );

    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session },
    );

    transaction.status = "COMPLETED";
    await transaction.save({ session });
    await session.commitTransaction();

    await emailService.sendTransactionEmail(
      req.user.email,
      req.user.name,
      amount,
      toAccount,
    );

    return res.status(201).json({
      message: "transaction completed",
      transaction,
    });
  } catch (error) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }

    if (transaction && transaction._id) {
      await transactionModel.findByIdAndUpdate(transaction._id, {
        status: "FAILED",
      });
    }

    return res.status(500).json({
      message: "transaction processing failed",
      error: error.message || error,
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

async function initalFund(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;
  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "toAccount , amount, idempotencykey are required",
    });
  }
  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });
  if (!toUserAccount) {
    return res.status(400).json({
      message: "invalid account",
    });
  }
  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });
  if (!fromUserAccount) {
    return res.status(400).json({
      message: "system user not found",
    });
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING",
  });

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session },
  );
  transaction.status = "COMPLETED";
  await transaction.save({ session });
  await session.commitTransaction();
  session.endSession();
  return res.status(201).json({
    message: "initial funds transaction completed successfylly",
    transaction: transaction,
  });
}

/**
 * 
 * // 1. get user

  // 2. get query params

  // 3. find account

  // 4. build filter

  // 5. count documents

  // 6. fetch transactions

  // 7. calculate total pages

   // 8. response
 */

async function getTransactionHistory(req,res){
  try{
    const user = req.user
    const {page, limit,status,minAmount,maxAmount}=req.query
    const account = await accountModel.findOne({user:user._id})
    if (!account) {
    return res.status(404).json({ message: "Account not found for the user" });
  }
    let currentPage = parseInt(page) || 1
    let currentLimit= parseInt(limit) || 10
    if(currentPage < 1) currentPage =1
    if(currentLimit > 10 ) currentLimit = 10
    const skip = (currentPage -1)*currentLimit

    const filter = {
      $or:[
        {fromAccount:account._id},
        {toAccount:account._id}
      ]
    }

    if(status){
      filter.status= status
    }
    const amountFilter = {}
    if(minAmount){
      amountFilter.$gte= parseFloat(minAmount)
    }
    if(maxAmount){
      amountFilter.$lte=parseFloat(maxAmount)
    }
    if(Object.keys(amountFilter).length>0){
      filter.amount = amountFilter
    }

    const totalTransactions = await transactionModel.countDocuments(filter)

    const transactions = await transactionModel.find(filter).skip(skip).limit(currentLimit)

    const totalPages = Math.ceil(totalTransactions/currentLimit)
    return res.status(200).json({
      transactions,
      pagination:{
        currentPage,
        limit:currentLimit,
        totalTransactions,
        totalPages
      }
    })
  }catch(error){
    console.error(error)
    return res.status(500).json({
      message:"internal server error"
    })
  }

}
module.exports = {
  createTransaction,
  initalFund,
  getTransactionHistory
};
