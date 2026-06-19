const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth.middleware");
const authorize = (role) => role === "admin" ? adminOnly : (req, res, next) => next();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getMyProducts, adminGetProducts, adminApproveProduct, adminRejectProduct, adminChangeStatus,
} = require("../controllers/product.controller");

router.get("/", getProducts);
router.get("/my", protect, getMyProducts);
router.get("/admin/all", protect, authorize("admin"), adminGetProducts);
router.post("/", protect, createProduct);
router.get("/:id", getProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);
router.patch("/:id/approve", protect, authorize("admin"), adminApproveProduct);
router.patch("/:id/reject", protect, authorize("admin"), adminRejectProduct);
router.patch("/:id/status", protect, authorize("admin"), adminChangeStatus);

module.exports = router;
