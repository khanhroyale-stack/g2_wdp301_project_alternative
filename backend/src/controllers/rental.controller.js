const RentalRequest = require("../models/rental_request.model");
const RentalContract = require("../models/rental_contract.model");
const RentalInspection = require("../models/rental_inspection.model");
const ProductPost = require("../models/product_post.model");
const { createNotification } = require("./notification.controller");

// ─── Helper: tính tiền thuê theo kỳ hạn ──────────────────────────────────────
const calcRentalFee = (product, totalDays) => {
  // Ưu tiên giá tháng → tuần → ngày
  if (product.rentPricePerMonth > 0 && totalDays >= 30) {
    const months = Math.floor(totalDays / 30);
    const remainDays = totalDays % 30;
    return months * product.rentPricePerMonth + remainDays * product.rentPricePerDay;
  }
  if (product.rentPricePerWeek > 0 && totalDays >= 7) {
    const weeks = Math.floor(totalDays / 7);
    const remainDays = totalDays % 7;
    return weeks * product.rentPricePerWeek + remainDays * product.rentPricePerDay;
  }
  return totalDays * product.rentPricePerDay;
};

// ─── Helper: kiểm tra trùng lịch thuê ────────────────────────────────────────
const checkRentalConflict = async (postId, startDate, endDate, excludeRequestId = null) => {
  // Kiểm tra request đang pending/approved
  const requestQuery = {
    postId,
    requestStatus: { $in: ["pending", "approved"] },
    $or: [
      { startDate: { $lt: endDate }, endDate: { $gt: startDate } },
    ],
  };
  if (excludeRequestId) requestQuery._id = { $ne: excludeRequestId };
  const conflictRequest = await RentalRequest.findOne(requestQuery);
  if (conflictRequest) return true;

  // Kiểm tra hợp đồng đang active
  const contractQuery = {
    postId,
    contractStatus: "active",
    $or: [
      { startDate: { $lt: endDate }, endDate: { $gt: startDate } },
    ],
  };
  const conflictContract = await RentalContract.findOne(contractQuery);
  return !!conflictContract;
};

const createRentalRequest = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.body.productId).populate("ownerId", "fullName");
    if (!product)
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    if (!["approved", "available"].includes(product.postStatus))
      return res.status(400).json({ success: false, message: "Sản phẩm chưa được duyệt hoặc không khả dụng" });
    if (product.productType === "sale")
      return res.status(400).json({ success: false, message: "Sản phẩm này không cho thuê" });
    if (!product.ownerId)
      return res.status(400).json({ success: false, message: "Không tìm thấy chủ sản phẩm" });

    if (product.ownerId._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: "Không thể thuê sản phẩm của chính mình" });

    const start = new Date(req.body.startDate);
    const end = new Date(req.body.endDate);
    if (isNaN(start) || isNaN(end))
      return res.status(400).json({ success: false, message: "Ngày không hợp lệ" });
    if (end <= start)
      return res.status(400).json({ success: false, message: "Ngày kết thúc phải sau ngày bắt đầu" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today)
      return res.status(400).json({ success: false, message: "Ngày bắt đầu không được trong quá khứ" });

    const hasConflict = await checkRentalConflict(product._id, start, end);
    if (hasConflict)
      return res.status(400).json({ success: false, message: "Sản phẩm đã được đặt thuê trong khoảng thời gian này" });

    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const rentalFee = calcRentalFee(product, totalDays);
    const depositAmount = product.depositAmount || 0;

    // Bỏ tắt validator Atlas runtime theo kế hoạch fix #14

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
      requestStatus: "pending",
    });

    try {
      await createNotification({
        recipientId: product.ownerId._id,
        title: "Yêu cầu thuê mới 📅",
        content: `Bạn nhận được yêu cầu thuê sản phẩm "${product.title}" trong ${totalDays} ngày.`,
        type: "NEW_RENTAL_REQUEST",
        relatedType: "rental",
        relatedId: request._id,
        link: "/thue-muon",
      });
    } catch (notiErr) {
      console.warn("[createRentalRequest] notification error:", notiErr.message);
    }

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    console.error("[createRentalRequest] error:", err.message);
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
      .populate("postId", "title thumbnailUrl rentPricePerDay rentPricePerWeek rentPricePerMonth depositAmount")
      .populate("ownerId", "fullName avatarUrl phone")
      .sort({ createdAt: -1 }).lean();
      
    const contracts = await RentalContract.find({ renterId: req.user._id })
      .populate("postId", "title thumbnailUrl rentPricePerDay rentPricePerWeek rentPricePerMonth depositAmount")
      .populate("ownerId", "fullName avatarUrl phone")
      .sort({ createdAt: -1 }).lean();

    res.json({ success: true, data: { requests, contracts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyLendings = async (req, res) => {
  try {
    const requests = await RentalRequest.find({ ownerId: req.user._id })
      .populate("postId", "title thumbnailUrl rentPricePerDay depositAmount")
      .populate("renterId", "fullName avatarUrl phone")
      .sort({ createdAt: -1 }).lean();
      
    const contracts = await RentalContract.find({ ownerId: req.user._id })
      .populate("postId", "title thumbnailUrl rentPricePerDay depositAmount")
      .populate("renterId", "fullName avatarUrl phone")
      .sort({ createdAt: -1 }).lean();

    res.json({ success: true, data: { requests, contracts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateRentalStatus = async (req, res) => {
  try {
    const { status, reason, compensationAmount, compensationReason } = req.body;

    // ── Tìm Request trước ──────────────────────────────────────────────────
    let request = await RentalRequest.findById(req.params.id)
      .populate("postId", "title rentPricePerDay rentPricePerWeek rentPricePerMonth")
      .populate("renterId", "_id fullName")
      .populate("ownerId", "_id fullName");

    if (request) {
      const s = status?.toLowerCase();

      // Owner chấp nhận → tạo contract (active = chờ renter nhận đồ)
      if (s === "accepted" || s === "approved") {
        if (request.ownerId._id.toString() !== req.user._id.toString())
          return res.status(403).json({ success: false, message: "Không có quyền" });
        if (request.requestStatus !== "pending")
          return res.status(400).json({ success: false, message: "Yêu cầu không còn ở trạng thái chờ" });

        request.requestStatus = "approved";
        await request.save();

        // Bỏ tắt validator Atlas runtime theo kế hoạch fix #14

        const contract = await RentalContract.create({
          requestId: request._id,
          postId:    request.postId._id,
          ownerId:   request.ownerId._id,
          renterId:  request.renterId._id,
          startDate: request.startDate,
          endDate:   request.endDate,
          rentalFee: request.rentalFee,
          depositAmount: request.depositAmount,
          handoverMethod: "meet_directly",
          contractStatus: "active", // chờ renter xác nhận đã nhận đồ
        });

        await ProductPost.findByIdAndUpdate(request.postId._id, { postStatus: "closed" });

        try {
          await createNotification({
            recipientId: request.renterId._id,
            title: "Yêu cầu thuê được chấp nhận ✅",
            content: `Chủ đồ đã chấp nhận yêu cầu thuê "${request.postId.title}". Vui lòng liên hệ chủ đồ để nhận hàng và xác nhận đã nhận đồ.`,
            type: "RENTAL_ACCEPTED",
            relatedType: "rental",
            relatedId: contract._id,
            link: "/thue-muon",
          });
        } catch (_) {}

        return res.json({ success: true, data: { request, contract } });
      }

      // Owner từ chối
      if (s === "rejected") {
        if (request.ownerId._id.toString() !== req.user._id.toString())
          return res.status(403).json({ success: false, message: "Không có quyền" });
        if (request.requestStatus !== "pending")
          return res.status(400).json({ success: false, message: "Yêu cầu không còn ở trạng thái chờ" });

        request.requestStatus = "rejected";
        if (reason) request.note = reason;
        await request.save();

        try {
          await createNotification({
            recipientId: request.renterId._id,
            title: "Yêu cầu thuê bị từ chối ❌",
            content: `Yêu cầu thuê "${request.postId.title}" đã bị từ chối.${reason ? ` Lý do: ${reason}` : ""}`,
            type: "RENTAL_REJECTED",
            relatedType: "rental",
            relatedId: request._id,
            link: "/thue-muon",
          });
        } catch (_) {}

        return res.json({ success: true, data: request });
      }

      // Renter hủy yêu cầu (chỉ khi còn pending)
      if (s === "cancelled") {
        if (request.renterId._id.toString() !== req.user._id.toString())
          return res.status(403).json({ success: false, message: "Không có quyền" });
        if (request.requestStatus !== "pending")
          return res.status(400).json({ success: false, message: "Chỉ hủy được yêu cầu đang chờ xác nhận" });

        request.requestStatus = "cancelled";
        if (reason) request.note = reason;
        await request.save();

        return res.json({ success: true, data: request });
      }
    }

    // ── Tìm Contract ───────────────────────────────────────────────────────
    let contract = await RentalContract.findById(req.params.id)
      .populate("postId", "title rentPricePerDay")
      .populate("renterId", "_id fullName")
      .populate("ownerId", "_id fullName");

    if (!contract) return res.status(404).json({ success: false, message: "Không tìm thấy" });

    const s = status?.toLowerCase();

    // Renter xác nhận đã nhận được đồ → bắt đầu thực sự thuê
    if (s === "renting") {
      if (contract.renterId._id.toString() !== req.user._id.toString())
        return res.status(403).json({ success: false, message: "Không có quyền" });
      if (contract.contractStatus !== "active")
        return res.status(400).json({ success: false, message: "Hợp đồng không ở trạng thái chờ nhận đồ" });

      contract.contractStatus = "renting";
      await contract.save();

      try {
        await createNotification({
          recipientId: contract.ownerId._id,
          title: "Người thuê đã nhận đồ 📦",
          content: `Người thuê đã xác nhận nhận được "${contract.postId.title}". Hợp đồng đang có hiệu lực.`,
          type: "RENTAL_STARTED",
          relatedType: "rental",
          relatedId: contract._id,
          link: "/thue-muon",
        });
      } catch (_) {}

      return res.json({ success: true, data: contract, message: "Đã xác nhận nhận đồ" });
    }

    // Hoàn tất hợp đồng (sau khi xử lý cọc)
    if (s === "completed") {
      contract.contractStatus = "completed";
      if (compensationAmount !== undefined) {
        contract.compensationAmount = compensationAmount;
        contract.depositRefundAmount = Math.max(0, contract.depositAmount - compensationAmount);
      } else {
        contract.depositRefundAmount = contract.depositAmount;
      }
      if (compensationReason) contract.accessoriesNote = compensationReason;
      await ProductPost.findByIdAndUpdate(contract.postId._id, { postStatus: "approved" });

    } else if (s === "disputed") {
      contract.contractStatus = "disputed";

    } else if (s === "cancelled") {
      contract.contractStatus = "cancelled";
      await ProductPost.findByIdAndUpdate(contract.postId._id, { postStatus: "approved" });

    } else {
      contract.contractStatus = s;
    }

    await contract.save();
    res.json({ success: true, data: contract });
  } catch (err) {
    console.error("[updateRentalStatus]", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/rentals/:id/return — Renter gửi yêu cầu trả đồ
const requestReturn = async (req, res) => {
  try {
    const contract = await RentalContract.findById(req.params.id)
      .populate("postId", "title")
      .populate("ownerId", "_id fullName");

    if (!contract)
      return res.status(404).json({ success: false, message: "Không tìm thấy hợp đồng" });

    if (contract.renterId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Không có quyền" });

    if (contract.contractStatus !== "renting")
      return res.status(400).json({ success: false, message: "Chỉ có thể trả đồ khi đang trong quá trình thuê" });

    contract.contractStatus = "return_requested";
    await contract.save();

    try {
      await createNotification({
        recipientId: contract.ownerId._id,
        title: "Yêu cầu trả đồ 📦",
        content: `Người thuê đã gửi yêu cầu trả lại "${contract.postId.title}". Vui lòng kiểm tra và xử lý tiền cọc.`,
        type: "RETURN_REQUESTED",
        relatedType: "rental",
        relatedId: contract._id,
        link: "/thue-muon",
      });
    } catch (_) {}

    res.json({ success: true, data: contract, message: "Đã gửi yêu cầu trả đồ" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/rentals/:id/resolve-deposit — Admin hoặc Owner xử lý cọc
const resolveDeposit = async (req, res) => {
  try {
    const { compensationAmount, compensationReason } = req.body;

    const contract = await RentalContract.findById(req.params.id)
      .populate("postId", "title")
      .populate("renterId", "_id name");

    if (!contract)
      return res.status(404).json({ success: false, message: "Không tìm thấy hợp đồng" });

    // Chỉ owner hoặc admin mới được xử lý
    const isOwner = contract.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ success: false, message: "Không có quyền xử lý cọc" });

    if (!["return_requested", "disputed"].includes(contract.contractStatus))
      return res.status(400).json({ success: false, message: "Chỉ xử lý cọc khi đồ đã được trả hoặc đang tranh chấp" });

    const comp = Math.max(0, compensationAmount || 0);
    const refund = Math.max(0, contract.depositAmount - comp);

    contract.compensationAmount = comp;
    contract.depositRefundAmount = refund;
    if (compensationReason) contract.accessoriesNote = compensationReason;
    contract.contractStatus = "completed";

    await ProductPost.findByIdAndUpdate(contract.postId._id, { postStatus: "approved" });
    await contract.save();

    // Thông báo cho renter
    await createNotification({
      recipientId: contract.renterId._id,
      title: "Kết quả xử lý cọc 💰",
      content: comp > 0
        ? `Cọc của bạn: bị trừ ${comp.toLocaleString("vi-VN")}đ bồi thường, hoàn lại ${refund.toLocaleString("vi-VN")}đ. Lý do: ${compensationReason || "Hư hỏng sản phẩm"}`
        : `Cọc của bạn được hoàn 100% (${refund.toLocaleString("vi-VN")}đ).`,
      type: "DEPOSIT_RESOLVED",
      relatedType: "rental",
      relatedId: contract._id,
      link: "/thue-muon",
    });

    res.json({ success: true, data: contract, message: "Xử lý cọc thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const extendRental = async (req, res) => {
  try {
    const { extraDays } = req.body;
    if (!extraDays || extraDays <= 0)
      return res.status(400).json({ success: false, message: "Số ngày gia hạn không hợp lệ" });

    const contract = await RentalContract.findById(req.params.id).populate("postId");
    if (!contract || !["active", "renting"].includes(contract.contractStatus))
      return res.status(400).json({ success: false, message: "Hợp đồng không khả dụng để gia hạn" });

    if (contract.renterId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Chỉ người thuê mới có thể gia hạn" });

    // Kiểm tra không trùng lịch mới sau khi gia hạn
    const currentEnd = new Date(contract.endDate);
    const newEnd = new Date(currentEnd.getTime() + extraDays * 24 * 60 * 60 * 1000);

    const hasConflict = await checkRentalConflict(contract.postId._id, currentEnd, newEnd, null);
    if (hasConflict)
      return res.status(400).json({ success: false, message: "Không thể gia hạn vì đã có lịch thuê khác" });

    const extraFee = calcRentalFee(contract.postId, extraDays);
    contract.endDate = newEnd;
    contract.rentalFee += extraFee;
    await contract.save();

    await createNotification({
      recipientId: contract.ownerId,
      title: "Khách hàng gia hạn thuê 📅",
      content: `Khách hàng vừa gia hạn thuê "${contract.postId.title}" thêm ${extraDays} ngày (đến ${newEnd.toLocaleDateString("vi-VN")}).`,
      type: "GENERAL",
      relatedType: "rental",
      relatedId: contract._id,
      link: "/thue-muon",
    });

    res.json({ success: true, data: contract, message: "Gia hạn thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createRentalRequest, getRental, getMyRentals, getMyLendings, updateRentalStatus, extendRental, requestReturn, resolveDeposit };
