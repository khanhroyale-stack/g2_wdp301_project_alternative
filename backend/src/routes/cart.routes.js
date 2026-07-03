const express = require("express");
const {
  getMyCart,
  addCartItem,
  removeCartItem,
  checkoutCart,
} = require("../controllers/cart.controller");
const { protect, activeOnly } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect, activeOnly);

router.get("/", getMyCart);
router.post("/items", addCartItem);
router.delete("/items/:productId", removeCartItem);
router.post("/checkout", checkoutCart);

module.exports = router;
