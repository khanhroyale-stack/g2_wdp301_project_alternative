const express = require("express");
const {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getFeaturedProducts,
  setFeaturedProducts,
  adminGetProducts,
  adminApproveProduct,
  adminRejectProduct,
  adminChangeStatus,
} = require("../controllers/product.controller");
const { protect, adminOnly, activeOnly } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/my", protect, activeOnly, getMyProducts);
router.get("/my/featured", protect, activeOnly, getFeaturedProducts);
router.post("/my/featured", protect, activeOnly, setFeaturedProducts);
router.get("/admin/all", protect, adminOnly, adminGetProducts);
router.post("/", protect, activeOnly, createProduct);
router.patch("/:id/approve", protect, adminOnly, adminApproveProduct);
router.patch("/:id/reject", protect, adminOnly, adminRejectProduct);
router.patch("/:id/status", protect, adminOnly, adminChangeStatus);
router.put("/:id", protect, activeOnly, updateProduct);
router.delete("/:id", protect, activeOnly, deleteProduct);
router.get("/:id", getProductById);

module.exports = router;
