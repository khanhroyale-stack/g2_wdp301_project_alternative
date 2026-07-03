const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const { getCategories, adminGetCategories, createCategory, updateCategory, deleteCategory } = require("../controllers/category.controller");

router.get("/", getCategories);
router.get("/admin/all", protect, authorize("admin"), adminGetCategories);
router.post("/", protect, authorize("admin"), createCategory);
router.put("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

module.exports = router;
