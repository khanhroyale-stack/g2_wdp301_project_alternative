const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const { uploadImages } = require("../controllers/upload.controller");
const { protect } = require("../middleware/auth.middleware");

// Expects multipart/form-data with a field named "images" containing up to 8 files.
router.post("/", protect, upload.array("images", 8), uploadImages);

module.exports = router;
