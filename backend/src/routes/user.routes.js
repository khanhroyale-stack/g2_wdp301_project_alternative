const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const {
  getAllUsers, getUserById, updateUser, deleteUser,
  approveUser, rejectUser, deductReputation,
} = require("../controllers/user.controller");

router.get("/", protect, authorize("admin"), getAllUsers);
router.get("/:id", protect, getUserById);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);
router.patch("/:id/approve", protect, authorize("admin"), approveUser);
router.patch("/:id/reject", protect, authorize("admin"), rejectUser);
router.patch("/:id/deduct-reputation", protect, authorize("admin"), deductReputation);

module.exports = router;
