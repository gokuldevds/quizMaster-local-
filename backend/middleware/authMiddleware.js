const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id || decoded._id;

      if (!userId) {
        return res.status(401).json({ message: "Invalid token payload" });
      }

      req.user = await User.findById(userId).select("-password");
      console.log("✅ Authenticated user:", req.user ? req.user._id : "None");


      if (!req.user) {
        return res.status(404).json({ message: "User not found" });
      }

      return next();
    } catch (err) {
      console.error("❌ Auth error:", err.message);
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
  }

  res.status(401).json({ message: "No token, authorization denied" });
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  res.status(403).json({ message: "Access denied, admin only" });
};
