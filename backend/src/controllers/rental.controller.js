const Rental = require("../models/rental.model");
const Product = require("../models/product.model");
const { createNotification } = require("./notification.controller");

const createRentalRequest = async (req, res) => {
  try {
    const product = await Product.findById(req.body.productId).populate("seller", "name");
    if (!product || product.status !== "ACTIVE" || product.listingType !== "cho-thue")
      return res.status(400).json({ success: false, message: "Sản phẩm không khả dụng để thuê" });

    if (product.seller._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: "Không thể thuê sản phẩm của chính mình" });

    const start = new Date(req.body.startDate);
    const end = new Date(req.body.endDate);
    if (end <= start) return res.status(400).json({ success: false, message: "Ngày kết thúc phải sau ngày bắt đầu" });

    // Ensure dates don't overlap with existing active rentals
    const overlapping = await Rental.findOne({
      product: product._id,
      status: { $in: ["ACCEPTED", "ACTIVE"] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ success: false, message: "Sản phẩm đã được thuê trong khoảng thời gian này" });
    }

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const rentalFee = product.rentalPricePerDay * totalDays;
    const depositAmount = product.depositAmount || 0;

    const rental = await Rental.create({
      renter: req.user._id,
      owner: product.seller._id,
      product: product._id,
      startDate: start,
      endDate: end,
      totalDays,
      rentalFee,
      depositAmount,
      totalAmount: rentalFee + depositAmount,
      note: req.body.note || "",
    });

    await createNotification({
      recipientId: product.seller._id,
      title: "Yêu cầu thuê mới 📅",
      message: `Bạn nhận được yêu cầu thuê sản phẩm "${product.title}" trong ${totalDays} ngày.`,
      type: "NEW_RENTAL_REQUEST",
      link: "/thue-muon",
    });

    res.status(201).json({ success: true, data: rental });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate("product")
      .populate("renter", "name avatar phone")
      .populate("owner", "name avatar phone");
    if (!rental) return res.status(404).json({ success: false, message: "Không tìm thấy hợp đồng thuê" });
    res.json({ success: true, data: rental });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyRentals = async (req, res) => {
  try {
    const rentals = await Rental.find({ renter: req.user._id })
      .populate("product", "title images rentalPricePerDay")
      .populate("owner", "name avatar phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: rentals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyLendings = async (req, res) => {
  try {
    const rentals = await Rental.find({ owner: req.user._id })
      .populate("product", "title images")
      .populate("renter", "name avatar phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: rentals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateRentalStatus = async (req, res) => {
  try {
    const { status, reason, compensationAmount, compensationReason } = req.body;
    const rental = await Rental.findById(req.params.id)
      .populate("product", "title")
      .populate("renter", "_id")
      .populate("owner", "_id");
    if (!rental) return res.status(404).json({ success: false, message: "Không tìm thấy" });

    rental.status = status;
    if (reason) rental.rejectedReason = reason;
    if (compensationAmount !== undefined) rental.compensationAmount = compensationAmount;
    if (compensationReason) rental.compensationReason = compensationReason;

    if (status === "ACCEPTED") {
      await createNotification({
        recipientId: rental.renter._id,
        title: "Yêu cầu thuê được chấp nhận ✅",
        message: `Yêu cầu thuê "${rental.product?.title}" của bạn đã được chủ đồ chấp nhận.`,
        type: "RENTAL_ACCEPTED",
        link: "/thue-muon",
      });
    }

    if (status === "REJECTED") {
      await createNotification({
        recipientId: rental.renter._id,
        title: "Yêu cầu thuê bị từ chối ❌",
        message: `Yêu cầu thuê "${rental.product?.title}" bị từ chối. Lý do: ${reason}`,
        type: "RENTAL_REJECTED",
        link: "/thue-muon",
      });
    }

    if (status === "ACTIVE") {
      await Product.findByIdAndUpdate(rental.product._id, { status: "RENTING" });
    }
    if (["COMPLETED", "CANCELLED"].includes(status)) {
      await Product.findByIdAndUpdate(rental.product._id, { status: "ACTIVE" });
      
      if (status === "COMPLETED") {
        await createNotification({
          recipientId: rental.renter._id,
          title: "Hợp đồng thuê hoàn tất 🎉",
          message: `Quá trình thuê "${rental.product?.title}" đã hoàn tất. Cảm ơn bạn!`,
          type: "GENERAL",
          link: "/thue-muon",
        });
      }
    }

    await rental.save();
    res.json({ success: true, data: rental });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const extendRental = async (req, res) => {
  try {
    const { extraDays } = req.body;
    if (!extraDays || extraDays <= 0) return res.status(400).json({ success: false, message: "Số ngày gia hạn không hợp lệ" });

    const rental = await Rental.findById(req.params.id).populate("product");
    if (!rental || rental.status !== "ACTIVE") {
      return res.status(400).json({ success: false, message: "Hợp đồng không khả dụng để gia hạn" });
    }

    const currentEnd = new Date(rental.endDate);
    const newEnd = new Date(currentEnd.getTime() + extraDays * 24 * 60 * 60 * 1000);

    const extraFee = rental.product.rentalPricePerDay * extraDays;

    rental.endDate = newEnd;
    rental.totalDays += extraDays;
    rental.rentalFee += extraFee;
    rental.totalAmount += extraFee;

    await rental.save();

    await createNotification({
      recipientId: rental.owner,
      title: "Khách hàng gia hạn thuê 📅",
      message: `Khách hàng vừa gia hạn thuê "${rental.product.title}" thêm ${extraDays} ngày.`,
      type: "GENERAL",
      link: "/thue-muon",
    });

    res.json({ success: true, data: rental, message: "Gia hạn thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createRentalRequest, getRental, getMyRentals, getMyLendings, updateRentalStatus, extendRental };
