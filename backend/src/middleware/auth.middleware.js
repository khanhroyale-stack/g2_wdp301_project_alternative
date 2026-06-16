const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Check if user is banned or has 0 reputation
    if (req.user.accountStatus === "BANNED" || req.user.reputationScore === 0) {
      return res.status(403).json({ success: false, message: "Account is banned due to violations" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Role ${req.user ? req.user.role : 'Unknown'} is not authorized to access this route` });
    }
    next();
  };
};

const requireKyc = (req, res, next) => {
  if (req.user && req.user.accountStatus === "APPROVED") {
    next();
  } else {
    res.status(403).json({ success: false, message: "KYC verification required to perform this action" });
  }
};

module.exports = { protect, authorize, requireKyc };
