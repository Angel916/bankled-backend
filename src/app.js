const express = require("express")
const app = express()
const authRoutes = require("./routes/auth.routes")
const accountRoutes = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")
const cookieparser = require("cookie-parser")
app.use(express.json())
app.use(cookieparser())

app.get("/",(req,res)=>{
    res.send("Welcome to the banking app")
})

app.use("/api/auth",authRoutes)
app.use("/api/accounts",accountRoutes)
app.use("/api/transaction",transactionRoutes)

module.exports=app