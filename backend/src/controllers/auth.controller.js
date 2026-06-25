const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { generateOTP, saveOTP, verifyOTP, getResendCooldown } = require("../utils/otp");
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
  dateOfBirth: user.dateOfBirth,
  gender: user.gender,
  addresses: buildAddresses(user),
  role: user.role,
  reputationScore: user.reputationScore,
  accountStatus: user.accountStatus,
});

const register = async (req, res) => {
  try {
    const { fullName, password, phone, address, dateOfBirth, gender } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Vui long dien day du thong tin" });
    }

    let dob = undefined;
    if (dateOfBirth) {
      dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ success: false, message: "Ngay sinh khong hop le" });
      }
      const now = new Date();
      if (dob > now) {
        return res.status(400).json({ success: false, message: "Ngay sinh khong duoc o tuong lai" });
      }
      const age = (now - dob) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 13) {
        return res.status(400).json({ success: false, message: "Ban phai du 13 tuoi tro len de dang ky" });
      }
    }

    if (gender && !["male", "female", "other"].includes(gender)) {
      return res.status(400).json({ success: false, message: "Gioi tinh khong hop le" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email da duoc su dung" });
    }

    const user = await User.create({ fullName, email, passwordHash: password, phone, address, dateOfBirth: dob, gender });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: "Dang ky thanh cong.",
      token,
      user: formatUser(user),
    });
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

    const cooldown = getResendCooldown(email, "reset");
    if (cooldown > 0) {
      return res.status(429).json({
        success: false,
        message: `Vui long doi ${cooldown}s truoc khi gui lai OTP`,
        retryAfter: cooldown,
      });
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

    const result = verifyOTP(email, otp, "reset");
    if (!result.success) {
      return res.status(400).json({ success: false, message: otpErrorMessage(result) });
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

const getMe = async (req, res) => {
  res.json({ success: true, user: formatUser(req.user) });
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
};
