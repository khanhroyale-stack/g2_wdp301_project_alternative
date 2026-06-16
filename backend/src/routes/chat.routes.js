const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { getOrCreateChat, getMyChats, sendMessage } = require("../controllers/chat.controller");

router.post("/", protect, getOrCreateChat);
router.get("/", protect, getMyChats);
router.post("/:chatId/messages", protect, sendMessage);

module.exports = router;
