const RentalRequest = require("../models/rental_request.model");
const RentalContract = require("../models/rental_contract.model");
const ProductPost = require("../models/product_post.model");
const { createNotification } = require("./notification.controller");

const createRentalRequest = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.body.productId).populate("ownerId", "name");
    if (!product || !["approved", "available"].includes(product.postStatus) || product.productType === "sale")
      return res.status(400).json({ success: false, message: "Sản phẩm không khả dụng để thuê" });

    if (product.ownerId._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: "Không thể thuê sản phẩm của chính mình" });

    const start = new Date(req.body.startDate);
    const end = new Date(req.body.endDate);
    if (end <= start) return res.status(400).json({ success: false, message: "Ngày kết thúc phải sau ngày bắt đầu" });

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const rentalFee = product.rentPricePerDay * totalDays;
    const depositAmount = product.depositAmount || 0;

    const request = await RentalRequest.create({
      renterId: req.user._id,
      ownerId: product.ownerId._id,
      postId: product._id,
      startDate: start,
      endDate: end,
      totalDays,
      rentalFee,
      depositAmount,
      totalAmount: rentalFee + depositAmount,
      note: req.body.note || "",
      requestStatus: "pending"
    });

    await createNotification({
      recipientId: product.ownerId._id,
      title: "Yêu cầu thuê mới 📅",
      message: `Bạn nhận được yêu cầu thuê sản phẩm "${product.title}" trong ${totalDays} ngày.`,
      type: "NEW_RENTAL_REQUEST",
      link: "/thue-muon",
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getRental = async (req, res) => {
  try {
    let rental = await RentalContract.findById(req.params.id)
      .populate("postId")
      .populate("renterId", "name avatar phone")
      .populate("ownerId", "name avatar phone");
      
    if (!rental) {
      rental = await RentalRequest.findById(req.params.id)
        .populate("postId")
        .populate("renterId", "name avatar phone")
        .populate("ownerId", "name avatar phone");
    }

    if (!rental) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    res.json({ success: true, data: rental });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyRentals = async (req, res) => {
  try {
    const requests = await RentalRequest.find({ renterId: req.user._id })
      .populate("postId", "title images rentPricePerDay")
      .populate("ownerId", "name avatar phone")
      .sort({ createdAt: -1 }).lean();
      
    const contracts = await RentalContract.find({ renterId: req.user._id })
      .populate("postId", "title images rentPricePerDay")
      .populate("ownerId", "name avatar phone")
      .sort({ createdAt: -1 }).lean();

    res.json({ success: true, data: { requests, contracts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyLendings = async (req, res) => {
  try {
    const requests = await RentalRequest.find({ ownerId: req.user._id })
      .populate("postId", "title images")
      .populate("renterId", "name avatar phone")
      .sort({ createdAt: -1 }).lean();
      
    const contracts = await RentalContract.find({ ownerId: req.user._id })
      .populate("postId", "title images")
      .populate("renterId", "name avatar phone")
      .sort({ createdAt: -1 }).lean();

    res.json({ success: true, data: { requests, contracts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateRentalStatus = async (req, res) => {
  try {
    const { status, reason, compensationAmount, compensationReason } = req.body;
    
    // First try finding request
    let request = await RentalRequest.findById(req.params.id)
      .populate("postId", "title")
      .populate("renterId", "_id")
      .populate("ownerId", "_id");

    if (request) {
       // Logic for updating request
       if (status === "ACCEPTED" || status === "approved") {
         request.requestStatus = "approved";
         
         // Create contract
         await RentalContract.create({
            requestId: request._id,
            postId: request.postId._id,
            ownerId: request.ownerId._id,
            renterId: request.renterId._id,
            startDate: request.startDate,
            endDate: request.endDate,
            rentalFee: request.rentalFee,
            depositAmount: request.depositAmount,
            handoverMethod: "meet_directly",
            contractStatus: "active"
         });
         
         await ProductPost.findByIdAndUpdate(request.postId._id, { postStatus: "rented" });
       } else if (status === "REJECTED" || status === "rejected") {
         request.requestStatus = "rejected";
         if (reason) request.note = reason;
       }
       await request.save();
       return res.json({ success: true, data: request });
    }

    // Otherwise try finding contract
    let contract = await RentalContract.findById(req.params.id)
      .populate("postId", "title")
      .populate("renterId", "_id")
      .populate("ownerId", "_id");
      
    if (!contract) return res.status(404).json({ success: false, message: "Không tìm thấy" });

    contract.contractStatus = status.toLowerCase();
    if (compensationAmount !== undefined) contract.compensationAmount = compensationAmount;
    if (compensationReason) contract.accessoriesNote = compensationReason; // Using accessoriesNote as reason for now

    if (["completed", "cancelled"].includes(contract.contractStatus)) {
      await ProductPost.findByIdAndUpdate(contract.postId._id, { postStatus: "available" });
    }

    await contract.save();
    res.json({ success: true, data: contract });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const extendRental = async (req, res) => {
  try {
    const { extraDays } = req.body;
    if (!extraDays || extraDays <= 0) return res.status(400).json({ success: false, message: "Số ngày gia hạn không hợp lệ" });

    const contract = await RentalContract.findById(req.params.id).populate("postId");
    if (!contract || contract.contractStatus !== "active") {
      return res.status(400).json({ success: false, message: "Hợp đồng không khả dụng để gia hạn" });
    }

    const currentEnd = new Date(contract.endDate);
    const newEnd = new Date(currentEnd.getTime() + extraDays * 24 * 60 * 60 * 1000);

    const extraFee = contract.postId.rentPricePerDay * extraDays;

    contract.endDate = newEnd;
    contract.rentalFee += extraFee;

    await contract.save();

    await createNotification({
      recipientId: contract.ownerId,
      title: "Khách hàng gia hạn thuê 📅",
      message: `Khách hàng vừa gia hạn thuê "${contract.postId.title}" thêm ${extraDays} ngày.`,
      type: "GENERAL",
      link: "/thue-muon",
    });

    res.json({ success: true, data: contract, message: "Gia hạn thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createRentalRequest, getRental, getMyRentals, getMyLendings, updateRentalStatus, extendRental };
