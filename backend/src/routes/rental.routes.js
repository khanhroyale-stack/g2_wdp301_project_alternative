const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth.middleware");
const {
  getRentalAvailability,
  createRentalRequest,
  getRental,
  getMyRentals,
  getMyLendings,
  updateRentalStatus,
  extendRental,
  confirmExtend,
  requestReturn,
  resolveDeposit,
} = require("../controllers/rental.controller");

// Kiểm tra lịch trống (public)
router.get("/availability/:productId", getRentalAvailability);

// Danh sách
router.get("/my-rentals",  protect, getMyRentals);
router.get("/my-lendings", protect, getMyLendings);

// Tạo yêu cầu thuê
router.post("/", protect, createRentalRequest);

// Chi tiết
router.get("/:id", protect, getRental);

// Cập nhật trạng thái
router.patch("/:id/status", protect, updateRentalStatus);

// Gia hạn: renter gửi yêu cầu
router.post("/:id/extend", protect, extendRental);

// Gia hạn: owner xác nhận hoặc từ chối
router.post("/:id/extend/confirm", protect, confirmExtend);

// Trả đồ
router.post("/:id/return", protect, requestReturn);

// Xử lý cọc
router.post("/:id/resolve-deposit", protect, resolveDeposit);

module.exports = router;
