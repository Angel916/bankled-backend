const mongoose = require("mongoose")
const bcrypt = require("bcrypt");
const { defaultMaxListeners } = require("nodemailer/lib/xoauth2");
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "email is required"],
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
    unique:[true,"email must be unique"]
  },
  name:{
    type:String,
    required:[true,"name is required"],
    trim:true,
    unique:[true,"name must be unique"]
  },
  password:{
    type:String, 
    required:[true,"password is required "],
    minlength:[6,"password must be atleast of 6 charcter "],
    select:false
  },
  SystemUser:{
    type:Boolean,
    default:false,
    immutable:true,
    select:false
  }
},{
    timestamps:true
});
userSchema.pre("save",async function (next) {
    if(!this.isModified("password")){
        return 
    }
    const hash = await bcrypt.hash(this.password,10)
    this.password=hash
    return 
})
userSchema.methods.comparePassword = async function (password) {
    console.log(password,this.password);
    return bcrypt.compare(password,this.password)
    
}
const userModel = mongoose.model("user",userSchema)
module.exports=userModel