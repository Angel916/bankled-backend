const mongoose = require("mongoose");

async function connectDB() {
  try {
    console.log(process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.log("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
