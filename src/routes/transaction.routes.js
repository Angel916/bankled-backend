const {Router } = require("express")
const authMiddleware = require("../middleware/auth.middlewars")
const transactionController = require("../controller/transaction.controller")

const transactionRoutes = Router()

/**
 * -POST/API/TRANSACTION
 * -CREATES A NEW TRANSACTION
 */
transactionRoutes.post("/",authMiddleware.authMiddleware,transactionController.createTransaction)

/**
 * -post/api/transaction/system/initial-funds
 * -create initial funds transaction from system user 
 */
transactionRoutes.post("/system/initialfund",authMiddleware.systemMiddleware,transactionController.initalFund)

/**
 * - get/api/transaction/history
 */
transactionRoutes.get("/history",authMiddleware.authMiddleware,transactionController.getTransactionHistory)
module.exports=transactionRoutes