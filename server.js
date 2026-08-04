require('dotenv').config()
const connectDB = require("./src/config/db")
connectDB()
const app = require("./src/app")
app.listen(3000,()=>{
    console.log('server is running on port 3000 ');
})