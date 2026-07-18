const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth.middleware");
const {
  getOrCreateRoom,
  getMyRooms,
  getMessages,
  sendMessage,
  adminGetRoomMessages,
} = require("../controllers/chat.controller");

router.post("/", protect, getOrCreateRoom);
router.get("/", protect, getMyRooms);
router.get("/:roomId/messages", protect, getMessages);
router.post("/:roomId/messages", protect, sendMessage);
router.get("/admin/:roomId", protect, adminOnly, adminGetRoomMessages);

module.exports = router;
