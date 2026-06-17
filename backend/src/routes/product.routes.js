const express = require("express");
const {
  getProducts,
  getProductById,
  getCategories
} = require("../controllers/product.controller");

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:id", getProductById);

module.exports = router;
