const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  getMyNotifications,
  getUnreadCount,
  markAllRead,
  markOneRead,
} = require("../controllers/notification.controller");

router.get("/", protect, getMyNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/read-all", protect, markAllRead);
router.patch("/:id/read", protect, markOneRead);

module.exports = router;
