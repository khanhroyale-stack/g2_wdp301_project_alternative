const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { getMyNotifications, markAllRead } = require("../controllers/notification.controller");

router.get("/", protect, getMyNotifications);
router.patch("/read-all", protect, markAllRead);

module.exports = router;
