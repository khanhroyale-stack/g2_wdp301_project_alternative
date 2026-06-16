const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getMyProducts, adminGetProducts, adminApproveProduct, adminRejectProduct,
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

module.exports = router;
