const express = require("express");
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
  getAllUsers,
  getUserById,
  updateUserByAdmin,
} = require("../controllers/user.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

router.get("/admin", protect, adminOnly, getAllUsers);
router.get("/admin/:id", protect, adminOnly, getUserById);
router.put("/admin/:id", protect, adminOnly, updateUserByAdmin);

router.get("/:id", getPublicProfile);

module.exports = router;
