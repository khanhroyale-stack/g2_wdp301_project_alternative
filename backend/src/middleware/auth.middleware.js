const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Tài khoản không tồn tại" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token không hợp lệ" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  res.status(403).json({ success: false, message: "Chỉ admin mới có quyền truy cập" });
};

const shipperOnly = (req, res, next) => {
  if (req.user?.role === "shipper" || req.user?.role === "admin") return next();
  res.status(403).json({ success: false, message: "Chỉ shipper mới có quyền truy cập" });
};

const activeOnly = (req, res, next) => {
  if (req.user?.accountStatus === "banned") {
    return res.status(403).json({ success: false, message: "Tài khoản đã bị khóa do vi phạm" });
  }
  next();
};

const verifiedOnly = (req, res, next) => {
  if (req.user?.verificationStatus !== "verified") {
    return res.status(403).json({
      success: false,
      message: "Tài khoản chưa được xác minh. Vui lòng upload giấy tờ và chờ admin duyệt.",
    });
  }
  next();
};

module.exports = { protect, adminOnly, shipperOnly, activeOnly, verifiedOnly };
