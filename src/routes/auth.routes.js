const express = 
require("express")
const authContoller = require("../controller/auth.controller")
const router = express.Router()
router.post("/register",authContoller.registerUser)
router.post("/login",authContoller.login)
router.post("/forget-password",authContoller.forgetPassword)
router.post("/verify-otp",authContoller.verifyOTP)
router.post("/reset-password",authContoller.resetPassword)
router.post("/logout",authContoller.logoutContoller);
module.exports= router