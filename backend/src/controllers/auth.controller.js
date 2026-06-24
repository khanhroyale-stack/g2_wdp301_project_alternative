const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { generateOTP, saveOTP, verifyOTP, getResendCooldown } = require("../utils/otp");
const { sendOTPEmail } = require("../config/email");

// Map kết quả verifyOTP (thất bại) sang message tiếng Việt
const otpErrorMessage = (result) => {
  if (result.reason === "locked") return "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới.";
  if (result.reason === "invalid") return `Mã OTP không đúng. Bạn còn ${result.attemptsLeft} lần thử.`;
  return "OTP không hợp lệ hoặc đã hết hạn";
};

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
  dateOfBirth: user.dateOfBirth,
  gender: user.gender,
  role: user.role,
  verificationStatus: user.verificationStatus,
  reputationScore: user.reputationScore,
  accountStatus: user.accountStatus,
});

// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, address, dateOfBirth, gender } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });
    }

    // Validate ngày sinh (nếu có): không ở tương lai, tuổi >= 13
    let dob = undefined;
    if (dateOfBirth) {
      dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ success: false, message: "Ngày sinh không hợp lệ" });
      }
      const now = new Date();
      if (dob > now) {
        return res.status(400).json({ success: false, message: "Ngày sinh không được ở tương lai" });
      }
      const age = (now - dob) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 13) {
        return res.status(400).json({ success: false, message: "Bạn phải từ 13 tuổi trở lên để đăng ký" });
      }
    }

    // Validate giới tính (nếu có)
    if (gender && !["male", "female", "other"].includes(gender)) {
      return res.status(400).json({ success: false, message: "Giới tính không hợp lệ" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email đã được sử dụng" });
    }

    const user = await User.create({
      fullName,
      email,
      passwordHash: password,
      phone,
      address,
      dateOfBirth: dob,
      gender: gender || undefined,
    });

    const otp = generateOTP();
    saveOTP(email, otp, "register");

    // Gửi email KHÔNG await — trả response ngay lập tức
    sendOTPEmail(email, otp, "register").catch((err) =>
      console.error("[Email Error - register]", err.message)
    );

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

    const result = verifyOTP(email, otp, "register");
    if (!result.success) {
      return res.status(400).json({ success: false, message: otpErrorMessage(result) });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
    }

    if (user.verificationStatus !== "verified") {
      user.verificationStatus = "verified";
      await user.save();
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

    if (user.verificationStatus !== "verified") {
      // Chỉ gửi OTP mới nếu không còn trong cooldown (tránh spam khi login lại liên tục)
      if (getResendCooldown(user.email, "register") === 0) {
        const otp = generateOTP();
        saveOTP(user.email, otp, "register");
        sendOTPEmail(user.email, otp, "register").catch((err) =>
          console.error("[Email Error - login unverified]", err.message)
        );
      }
      return res.status(403).json({
        success: false,
        message: "Tài khoản chưa xác thực email. Mã OTP mới đã được gửi, vui lòng nhập để kích hoạt.",
        needVerification: true,
        email: user.email,
      });
    }

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

    const cooldown = getResendCooldown(email, "reset");
    if (cooldown > 0) {
      return res.status(429).json({
        success: false,
        message: `Vui lòng đợi ${cooldown}s trước khi gửi lại OTP`,
        retryAfter: cooldown,
      });
    }

    const otp = generateOTP();
    saveOTP(email, otp, "reset");
    sendOTPEmail(email, otp, "reset").catch((err) =>
      console.error("[Email Error - forgot-password]", err.message)
    );

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

    const result = verifyOTP(email, otp, "reset");
    if (!result.success) {
      return res.status(400).json({ success: false, message: otpErrorMessage(result) });
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

    const cooldown = getResendCooldown(email, "register");
    if (cooldown > 0) {
      return res.status(429).json({
        success: false,
        message: `Vui lòng đợi ${cooldown}s trước khi gửi lại OTP`,
        retryAfter: cooldown,
      });
    }

    const otp = generateOTP();
    saveOTP(email, otp, "register");
    sendOTPEmail(email, otp, "register").catch((err) =>
      console.error("[Email Error - resend-otp]", err.message)
    );
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
