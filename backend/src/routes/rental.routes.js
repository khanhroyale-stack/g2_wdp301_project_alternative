const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { createRentalRequest, getRental, getMyRentals, getMyLendings, updateRentalStatus, extendRental } = require("../controllers/rental.controller");

router.post("/", protect, createRentalRequest);
router.get("/my-rentals", protect, getMyRentals);
router.get("/my-lendings", protect, getMyLendings);
router.get("/:id", protect, getRental);
router.patch("/:id/status", protect, updateRentalStatus);
router.post("/:id/extend", protect, extendRental);

module.exports = router;
