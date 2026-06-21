const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth.middleware");
const {
  createRentalRequest,
  getRental,
  getMyRentals,
  getMyLendings,
  updateRentalStatus,
  extendRental,
  requestReturn,
  resolveDeposit,
} = require("../controllers/rental.controller");

// Tạo yêu cầu thuê
router.post("/", protect, createRentalRequest);

// Xem danh sách
router.get("/my-rentals", protect, getMyRentals);
router.get("/my-lendings", protect, getMyLendings);

// Xem chi tiết
router.get("/:id", protect, getRental);

// Cập nhật trạng thái (chấp nhận / từ chối / hủy)
router.patch("/:id/status", protect, updateRentalStatus);

// Gia hạn thuê
router.post("/:id/extend", protect, extendRental);

// Yêu cầu trả sản phẩm
router.post("/:id/return", protect, requestReturn);

// Xử lý tiền cọc
router.post("/:id/resolve-deposit", protect, resolveDeposit);

module.exports = router;
