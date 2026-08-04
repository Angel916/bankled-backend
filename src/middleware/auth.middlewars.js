const userModel = require("../models/user.model")
const tokenBlackListModel = require("../models/blackList.model")
const jwt = require("jsonwebtoken")

async function authMiddleware(req,res,next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
    if(!token ){
        return res.status(401).json({
            message:"token not provided "
        })
    }
    const isBlacklisted = await tokenBlackListModel.findOne({ token });

    if (isBlacklisted) {
      return res.status(401).json({
        message: "Unauthorized access, token is invalid",
      });
    }

    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.userId)
        req.user = user 
        return next()
    }catch(err){
        res.status(401).json({message:"invalid token "})
    }
}
async function systemMiddleware(req, res, next) {
  
  const token = req.cookies.token || req.headers.authorization.split(" ")[1];
  console.log(token);
  if (!token) {
    return res.status(401).json({
      message: "unauthorizied access , token is missing ",
    });
    const isBlacklisted = await tokenBlackListModel.findOne({ token });

    if (isBlacklisted) {
      return res.status(401).json({
        message: "Unauthorized access, token is invalid",
      });
    }

  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId).select("+SystemUser");
    console.log(user);
   
  
    if (!user.SystemUser) {
      return res.status(403).json({
        message: "forbidden access , not a system user ",
      });
    }
    req.user = user;
    return next();
  } catch (err) {
    console.log(err);
    
    return res.status(401).json({
      message: "unauthorizied access , token invalid ",
    });
  }
}
module.exports = {
  authMiddleware,
  systemMiddleware
};