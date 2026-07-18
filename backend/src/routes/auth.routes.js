const express = require("express");
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  googleAuth,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  resendOTP,
  checkFeaturedReminder,
  markFeaturedSetupDone,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/change-password", protect, changePassword);
router.get("/me", protect, getMe);
router.get("/featured-reminder", protect, checkFeaturedReminder);
router.post("/mark-featured-done", protect, markFeaturedSetupDone);

module.exports = router;
