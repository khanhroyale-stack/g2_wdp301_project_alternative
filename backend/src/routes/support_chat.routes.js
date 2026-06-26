const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth.middleware");        
const { getMessages, sendMessage, getActiveCustomers } = require("../controllers/support_chat.controller");

router.get("/", protect, getMessages);
router.post("/", protect, sendMessage);
router.get("/admin/users", protect, adminOnly, getActiveCustomers);

module.exports = router;
