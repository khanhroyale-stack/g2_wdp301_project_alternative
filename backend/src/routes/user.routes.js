const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

router.get("/", protect, adminOnly, getAllUsers);
router.get("/:id", protect, getUserById);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;
