const express = require("express")
const Middleware = require("../middleware/auth.middlewars")
const accountController = require("../controller/account.controller")
const router = express.Router()

/**
 * -POST/API/ACCOUNTS/
 * -CREATE A NEW ACCOUNT
 * -PROTECTED ROUTE 
 */
router.post("/",Middleware.authMiddleware,accountController.createAccount)

/**
 * -GET/API/ACCOUNTS/DETAILS
 * -get account details 
 */
router.get("/details",Middleware.authMiddleware,accountController.getAccountDetails)
/**
 * -get/api/accounts/balance/:accountId
 * -get
 */
router.get("/balance/:accountId",Middleware.authMiddleware,accountController.getAccountBalance)
module.exports=router;