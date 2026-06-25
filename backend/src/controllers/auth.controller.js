const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { generateOTP, saveOTP, verifyOTP } = require("../utils/otp");
const { sendOTPEmail } = require("../config/email");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const normalizeEmail = (email) => email?.trim().toLowerCase();

const buildAddresses = (user) => {
  const existing = Array.isArray(user.addresses) ? user.addresses : [];

  if (existing.length) {
    return existing;
  }

  if (!user.address && !user.phone && !user.fullName) {
    return [];
  }

  return [
    {
      label: "Địa chỉ mặc định",
      recipientName: user.fullName || "",
      phone: user.phone || "",
      address: user.address || "",
      isDefault: true,
    },
  ];
};

const formatUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  address: user.address,
  addresses: buildAddresses(user),
  role: user.role,
  verificationStatus: user.verificationStatus,
  reputationScore: user.reputationScore,
  accountStatus: user.accountStatus,
});

const register = async (req, res) => {
  try {
    const { fullName, password, phone } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Vui long dien day du thong tin" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email da duoc su dung" });
    }

    await User.create({ fullName, email, passwordHash: password, phone });

    const otp = generateOTP();
    saveOTP(email, otp, "register");
    sendOTPEmail(email, otp, "register").catch((err) =>
      console.error("[Email Error - register]", err.message)
    );

    res.status(201).json({
      success: true,
      message: "Dang ky thanh cong. Vui long kiem tra email de lay ma OTP xac thuc.",
      email,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Thieu email hoac OTP" });
    }

    if (!verifyOTP(email, otp, "register")) {
      return res.status(400).json({ success: false, message: "OTP khong hop le hoac da het han" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Khong tim thay tai khoan" });
    }

    const token = generateToken(user._id);
    res.json({ success: true, token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Vui long nhap email va mat khau" });
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ success: false, message: "Email hoac mat khau khong dung" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: "Tai khoan nay chua co mat khau hop le. Hay dung Quen mat khau de thiet lap lai.",
      });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Email hoac mat khau khong dung" });
    }

    if (user.accountStatus === "banned") {
      return res.status(403).json({ success: false, message: "Tai khoan da bi khoa do vi pham" });
    }

    console.log(`[Auth] DEV MODE login without email verification: ${email}`);

    const token = generateToken(user._id);
    res.json({ success: true, token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "Email khong ton tai trong he thong" });
    }

    const otp = generateOTP();
    saveOTP(email, otp, "reset");
    sendOTPEmail(email, otp, "reset").catch((err) =>
      console.error("[Email Error - forgot-password]", err.message)
    );

    res.json({ success: true, message: "OTP da duoc gui den email cua ban" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Vui long dien day du thong tin" });
    }

    if (!verifyOTP(email, otp, "reset")) {
      return res.status(400).json({ success: false, message: "OTP khong hop le hoac da het han" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Khong tim thay tai khoan" });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ success: true, message: "Dat lai mat khau thanh cong" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Vui long dien day du thong tin" });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Mat khau hien tai khong dung" });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ success: true, message: "Doi mat khau thanh cong" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resendOTP = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "Email khong ton tai trong he thong" });
    }

    const otp = generateOTP();
    saveOTP(email, otp, "register");
    sendOTPEmail(email, otp, "register").catch((err) =>
      console.error("[Email Error - resend-otp]", err.message)
    );

    res.json({ success: true, message: "OTP moi da duoc gui den email cua ban" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, user: formatUser(req.user) });
};

module.exports = {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  resendOTP,
};
