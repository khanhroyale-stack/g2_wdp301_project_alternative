const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { generateOTP, saveOTP, verifyOTP } = require("../utils/otp");
const { sendOTPEmail } = require("../config/email");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const formatUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  address: user.address,
  role: user.role,
  verificationStatus: user.verificationStatus,
  reputationScore: user.reputationScore,
  accountStatus: user.accountStatus,
});

// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email đã được sử dụng" });
    }

    const user = await User.create({ fullName, email, passwordHash: password, phone });

    const otp = generateOTP();
    saveOTP(email, otp, "register");
    try {
      await sendOTPEmail(email, otp, "register");
    } catch (emailErr) {
      console.error("[Email Error - register]", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực.",
      email,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/verify-email
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Thiếu email hoặc OTP" });
    }

    if (!verifyOTP(email, otp, "register")) {
      return res.status(400).json({ success: false, message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
    }

    const token = generateToken(user._id);
    res.json({ success: true, token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }

    if (user.accountStatus === "banned") {
      return res.status(403).json({ success: false, message: "Tài khoản đã bị khóa do vi phạm" });
    }

    // TEMPORARY: Allow login without email verification for development
    // TODO: Remove this in production
    console.log(`⚠️  DEV MODE: User ${email} logged in without email verification`);

    const token = generateToken(user._id);
    res.json({ success: true, token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Email không tồn tại trong hệ thống" });
    }

    const otp = generateOTP();
    saveOTP(email, otp, "reset");
    try {
      await sendOTPEmail(email, otp, "reset");
    } catch (emailErr) {
      console.error("[Email Error - forgot-password]", emailErr.message);
    }

    res.json({ success: true, message: "OTP đã được gửi đến email của bạn" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
    }

    if (!verifyOTP(email, otp, "reset")) {
      return res.status(400).json({ success: false, message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ success: true, message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không đúng" });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/resend-otp
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Email không tồn tại trong hệ thống" });
    }
    const otp = generateOTP();
    saveOTP(email, otp, "register");
    try {
      await sendOTPEmail(email, otp, "register");
    } catch (emailErr) {
      console.error("[Email Error - resend-otp]", emailErr.message);
    }
    res.json({ success: true, message: "OTP mới đã được gửi đến email của bạn" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: formatUser(req.user) });
};

module.exports = { register, verifyEmail, login, forgotPassword, resetPassword, changePassword, getMe, resendOTP };
