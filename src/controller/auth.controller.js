const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlacklistModel = require("../models/blackList.model");
const otpModel = require("../models/otp.model");
const crypto = require("crypto");
async function registerUser(req, res) {
  const { email, password, name } = req.body;
  const isExist = await userModel.findOne({ email: email });
  if (isExist) {
    return res.status(422).json({
      message: "user already exist ",
      status: "failed",
    });
  }
  const User = await userModel.create({
    email,
    password,
    name,
  });
  const token = jwt.sign(
    {
      userIf: User._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "3d",
    },
  );
  res.cookie("token", token);
  res.status(201).json({
    message: "user registered successfully",
    user: {
      _id: User._id,
      email: User.email,
      name: User.name,
    },
  });
  await emailService.sendRegistrationEmail(User.email, User.name);
}
async function forgetPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await otpModel.deleteMany({ email });
    await otpModel.create({
      email: email,
      otp: otp,
      expiresAt: expiresAt,
    });
    console.log("otp",otp)

    await emailService.sendPasswordResetOTP(email, otp);
    return res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;  
    const otpRecord = await otpModel.findOne({email})  
    if(!otpRecord){
        return res.status(400).json({
            message:"invalid or expired otp"
        })
    }
    console.log("OTP expires at:", otpRecord.expiresAt);
    console.log("Current time:", new Date());
    if(otpRecord.expiresAt< new Date()){
        return res.status(400).json({
            message:"otp expired"
        })
    }
    if(otpRecord.otp !== otp){
        return res.status(400).json({
            message:"invalid otp"
        })
    }
    await otpModel.findByIdAndUpdate(otpRecord._id, { verified: true });

    return res.status(200).json({
        message: "OTP verified successfully"
    });
  }catch(error){
    return res.status(500).json({
        message:"internal server error"
    })
  }
}

async function resetPassword(req, res) {
    try{
        const {email,newPassword} = req.body
        const otpRecord = await otpModel.findOne({email})
        if(!otpRecord || !otpRecord.verified){
            return res.status(400).json({
                message:"OTP not verified"
            })
        }
        const user = await userModel.findOne({email})
        if(!user){
            return res.status(404).json({
                message:"user not found"
            })
        }
        user.password= newPassword
        await user.save()
        await otpModel.findByIdAndDelete(otpRecord._id)
        return res.status(200).json({
            message:"password reset successfully"
        })

    }catch(error){
        return res.status(500).json({
            message:"internal server error"
        })
    }
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await userModel
    .findOne({
      email: email,
    })
    .select("+password");

  if (!user) {
    return res.status(401).json({
      message: "invalid credentials ",
    });
  }
  const correctPassword = await user.comparePassword(password);
  if (!correctPassword) {
    return res.status(401).json({
      message: "incoorect password",
    });
  }
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  res.cookie("token", token);
  res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
}
async function logoutContoller(req, res) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(200).json({
      message: "user logged out successfully",
    });
  }
  await tokenBlacklistModel.create({
    token: token,
  });
  res.clearCookie("token");
  res.status(200).json({
    message: "user logged out successfully ",
  });
}
module.exports = {
  registerUser,
  login,
  logoutContoller,
  forgetPassword,
  verifyOTP,
    resetPassword,
};
