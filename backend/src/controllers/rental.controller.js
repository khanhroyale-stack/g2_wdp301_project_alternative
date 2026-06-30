const RentalRequest = require("../models/rental_request.model");
const RentalContract = require("../models/rental_contract.model");
const RentalInspection = require("../models/rental_inspection.model");
const ProductPost = require("../models/product_post.model");
const { createNotification } = require("./notification.controller");

// ─── Helper: tính tiền thuê theo kỳ hạn ──────────────────────────────────────
const calcRentalFee = (product, totalDays) => {
  if (product.rentPricePerMonth > 0 && totalDays >= 30) {
    const months = Math.floor(totalDays / 30);
    return months * product.rentPricePerMonth + (totalDays % 30) * product.rentPricePerDay;
  }
  if (product.rentPricePerWeek > 0 && totalDays >= 7) {
    const weeks = Math.floor(totalDays / 7);
    return weeks * product.rentPricePerWeek + (totalDays % 7) * product.rentPricePerDay;
  }
  return totalDays * (product.rentPricePerDay || 0);
};

// ─── Helper: kiểm tra trùng lịch (hỗ trợ quantity) ───────────────────────────
const checkRentalConflict = async (postId, startDate, endDate, excludeContractId = null, quantity = 1) => {
  // Đếm số request đang pending/approved trùng lịch
  const reqCount = await RentalRequest.countDocuments({
    postId,
    requestStatus: { $in: ["pending", "approved"] },
    startDate: { $lt: endDate },
    endDate:   { $gt: startDate },
  });

  // Đếm số contract đang active/renting/return_requested trùng lịch
  const contractQuery = {
    postId,
    contractStatus: { $in: ["active", "renting", "return_requested"] },
    startDate: { $lt: endDate },
    endDate:   { $gt: startDate },
  };
  if (excludeContractId) contractQuery._id = { $ne: excludeContractId };
  const contractCount = await RentalContract.countDocuments(contractQuery);

  // Nếu tổng số đang thuê >= số lượng → conflict
  return (reqCount + contractCount) >= quantity;
};

// ─── GET lịch đã đặt (public) ────────────────────────────────────────────────
const getRentalAvailability = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await ProductPost.findById(productId).select("quantity");
    const qty = product?.quantity || 1;

    const [requests, contracts] = await Promise.all([
      RentalRequest.find({ postId: productId, requestStatus: { $in: ["pending","approved"] } })
        .select("startDate endDate requestStatus"),
      RentalContract.find({ postId: productId, contractStatus: { $in: ["active","renting","return_requested"] } })
        .select("startDate endDate contractStatus"),
    ]);

    // Tính ngày nào đã đầy số lượng
    const bookedRanges = [
      ...requests.map(r => ({ start: r.startDate, end: r.endDate, type: "pending" })),
      ...contracts.map(c => ({ start: c.startDate, end: c.endDate, type: "booked" })),
    ];

    res.json({ success: true, data: bookedRanges, quantity: qty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createRentalRequest = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.body.productId).populate("ownerId", "fullName phone");
    if (!product)
      return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    if (!["approved", "available"].includes(product.postStatus))
      return res.status(400).json({ success: false, message: "Sản phẩm chưa được duyệt hoặc không khả dụng" });
    if (product.productType === "sale")
      return res.status(400).json({ success: false, message: "Sản phẩm này không cho thuê" });

    // ownerId có thể là object (populated) hoặc raw ObjectId (khi populate thất bại)
    const ownerIdRaw = product.ownerId?._id || product.ownerId;
    if (!ownerIdRaw)
      return res.status(400).json({ success: false, message: "Không tìm thấy chủ sản phẩm" });

    if (ownerIdRaw.toString() === req.user._id.toString())
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

    const hasConflict = await checkRentalConflict(product._id, start, end, null, product.quantity || 1);
    if (hasConflict)
      return res.status(400).json({ success: false, message: "Sản phẩm đã hết lịch thuê trong khoảng thời gian này" });

    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const rentalFee = calcRentalFee(product, totalDays);
    const depositAmount = product.depositAmount || 0;

    // Bỏ tắt validator Atlas runtime theo kế hoạch fix #14

    const request = await RentalRequest.create({
      renterId: req.user._id,
      ownerId: ownerIdRaw,
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
        recipientId: ownerIdRaw,
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
      .populate("postId", "title thumbnailUrl imageUrls rentPricePerDay depositAmount location categoryId")
      .populate("renterId", "fullName avatarUrl phone")
      .populate("ownerId",  "fullName avatarUrl phone");

    if (!rental) {
      rental = await RentalRequest.findById(req.params.id)
        .populate("postId", "title thumbnailUrl imageUrls rentPricePerDay depositAmount location categoryId")
        .populate("renterId", "fullName avatarUrl phone")
        .populate("ownerId",  "fullName avatarUrl phone");
    }

    if (!rental) return res.status(404).json({ success: false, message: "Không tìm thấy" });

    // Kiểm tra quyền: chỉ người liên quan hoặc admin mới xem được
    const uid = req.user._id.toString();
    const renterId = rental.renterId?._id?.toString() || rental.renterId?.toString();
    const ownerId  = rental.ownerId?._id?.toString()  || rental.ownerId?.toString();
    if (uid !== renterId && uid !== ownerId && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Không có quyền xem" });

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
        const ownerIdStr = (request.ownerId?._id || request.ownerId).toString();
        if (ownerIdStr !== req.user._id.toString())
          return res.status(403).json({ success: false, message: "Không có quyền" });
        if (request.requestStatus !== "pending")
          return res.status(400).json({ success: false, message: "Yêu cầu không còn ở trạng thái chờ" });

        request.requestStatus = "approved";
        await request.save();

        // Bỏ tắt validator Atlas runtime theo kế hoạch fix #14

        const ownerIdVal  = request.ownerId?._id  || request.ownerId;
        const renterIdVal = request.renterId?._id || request.renterId;
        const postIdVal   = request.postId?._id   || request.postId;

        const contract = await RentalContract.create({
          requestId: request._id,
          postId:    postIdVal,
          ownerId:   ownerIdVal,
          renterId:  renterIdVal,
          startDate: request.startDate,
          endDate:   request.endDate,
          rentalFee: request.rentalFee,
          depositAmount: request.depositAmount,
          handoverMethod: "meet_directly",
          contractStatus: "active",
        });

        await ProductPost.findByIdAndUpdate(postIdVal, { postStatus: "closed" });

        // Nếu quantity > 1, kiểm tra còn slot không — nếu còn thì giữ approved
        const postForQty = await ProductPost.findById(postIdVal).select("quantity");
        const qty = postForQty?.quantity || 1;
        const activeCount = await RentalContract.countDocuments({
          postId: postIdVal,
          contractStatus: { $in: ["active", "renting", "return_requested"] },
        });
        if (activeCount < qty) {
          await ProductPost.findByIdAndUpdate(postIdVal, { postStatus: "approved" });
        }

        try {
          await createNotification({
            recipientId: renterIdVal,
            title: "Yêu cầu thuê được chấp nhận ✅",
            content: `Chủ đồ đã chấp nhận yêu cầu thuê "${request.postId?.title || "sản phẩm"}". Vui lòng liên hệ chủ đồ để nhận hàng và xác nhận đã nhận đồ.`,
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
        const ownerIdStr = (request.ownerId?._id || request.ownerId).toString();
        if (ownerIdStr !== req.user._id.toString())
          return res.status(403).json({ success: false, message: "Không có quyền" });
        if (request.requestStatus !== "pending")
          return res.status(400).json({ success: false, message: "Yêu cầu không còn ở trạng thái chờ" });

        request.requestStatus = "rejected";
        if (reason) request.note = reason;
        await request.save();

        try {
          const renterIdVal = request.renterId?._id || request.renterId;
          await createNotification({
            recipientId: renterIdVal,
            title: "Yêu cầu thuê bị từ chối ❌",
            content: `Yêu cầu thuê "${request.postId?.title || "sản phẩm"}" đã bị từ chối.${reason ? ` Lý do: ${reason}` : ""}`,
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
        const renterIdStr = (request.renterId?._id || request.renterId).toString();
        if (renterIdStr !== req.user._id.toString())
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
      const renterIdStr = (contract.renterId?._id || contract.renterId).toString();
      if (renterIdStr !== req.user._id.toString())
        return res.status(403).json({ success: false, message: "Không có quyền" });
      if (contract.contractStatus !== "active")
        return res.status(400).json({ success: false, message: "Hợp đồng không ở trạng thái chờ nhận đồ" });

      contract.contractStatus = "renting";
      await contract.save();

      try {
        const ownerIdVal = contract.ownerId?._id || contract.ownerId;
        await createNotification({
          recipientId: ownerIdVal,
          title: "Người thuê đã nhận đồ 📦",
          content: `Người thuê đã xác nhận nhận được "${contract.postId?.title || "sản phẩm"}". Hợp đồng đang có hiệu lực.`,
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

// POST /api/rentals/:id/extend — Renter gửi yêu cầu gia hạn (chờ owner duyệt)
const extendRental = async (req, res) => {
  try {
    const { extraDays } = req.body;
    if (!extraDays || extraDays <= 0)
      return res.status(400).json({ success: false, message: "Số ngày gia hạn không hợp lệ (phải >= 1)" });

    const contract = await RentalContract.findById(req.params.id).populate("postId").populate("ownerId", "_id fullName");
    if (!contract || !["active", "renting"].includes(contract.contractStatus))
      return res.status(400).json({ success: false, message: "Hợp đồng không khả dụng để gia hạn" });

    if (!["renting", "active"].includes(contract.contractStatus))
      return res.status(400).json({ success: false, message: "Chỉ gia hạn được khi hợp đồng đang active hoặc đang thuê" });

    const renterIdStr = (contract.renterId?.toString());
    if (renterIdStr !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Chỉ người thuê mới có thể yêu cầu gia hạn" });

    if (contract.extendStatus === "pending")
      return res.status(400).json({ success: false, message: "Đã có yêu cầu gia hạn đang chờ chủ đồ xác nhận" });

    // Kiểm tra trùng lịch khoảng gia hạn
    const currentEnd = new Date(contract.endDate);
    const newEnd = new Date(currentEnd.getTime() + extraDays * 24 * 60 * 60 * 1000);
    const hasConflict = await checkRentalConflict(contract.postId._id, currentEnd, newEnd, contract._id, contract.postId.quantity || 1);
    if (hasConflict)
      return res.status(400).json({ success: false, message: "Không thể gia hạn vì đã có lịch thuê khác trong khoảng này" });

    const extraFee = calcRentalFee(contract.postId, extraDays);
    contract.pendingExtendDays = extraDays;
    contract.pendingExtendFee = extraFee;
    contract.extendStatus = "pending";
    await contract.save();

    try {
      const ownerIdVal = contract.ownerId?._id || contract.ownerId;
      await createNotification({
        recipientId: ownerIdVal,
        title: "Yêu cầu gia hạn thuê 📅",
        content: `Người thuê muốn gia hạn thêm ${extraDays} ngày cho "${contract.postId.title}". Vui lòng xác nhận.`,
        type: "EXTEND_REQUESTED",
        relatedType: "rental",
        relatedId: contract._id,
        link: "/thue-muon",
      });
    } catch (_) {}

    res.json({ success: true, data: contract, message: `Đã gửi yêu cầu gia hạn ${extraDays} ngày, đang chờ chủ đồ xác nhận` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/rentals/:id/extend/confirm — Owner xác nhận hoặc từ chối gia hạn
const confirmExtend = async (req, res) => {
  try {
    const { action } = req.body; // "approve" | "reject"

    const contract = await RentalContract.findById(req.params.id).populate("postId").populate("renterId", "_id fullName");
    if (!contract)
      return res.status(404).json({ success: false, message: "Không tìm thấy hợp đồng" });

    const ownerIdStr = (contract.ownerId?._id || contract.ownerId).toString();
    if (ownerIdStr !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Chỉ chủ đồ mới có thể xác nhận gia hạn" });

    if (contract.extendStatus !== "pending")
      return res.status(400).json({ success: false, message: "Không có yêu cầu gia hạn đang chờ" });

    const renterIdVal = contract.renterId?._id || contract.renterId;

    if (action === "approve") {
      const newEnd = new Date(contract.endDate.getTime() + contract.pendingExtendDays * 24 * 60 * 60 * 1000);
      contract.endDate = newEnd;
      contract.rentalFee += contract.pendingExtendFee;
      contract.extendStatus = "approved";
      contract.pendingExtendDays = 0;
      contract.pendingExtendFee = 0;
      await contract.save();

      try {
        await createNotification({
          recipientId: renterIdVal,
          title: "Gia hạn được chấp nhận ✅",
          content: `Chủ đồ đã chấp nhận gia hạn "${contract.postId.title}" đến ${newEnd.toLocaleDateString("vi-VN")}.`,
          type: "EXTEND_APPROVED",
          relatedType: "rental",
          relatedId: contract._id,
          link: "/thue-muon",
        });
      } catch (_) {}

      return res.json({ success: true, data: contract, message: "Đã chấp nhận gia hạn" });
    }

    // Reject
    contract.extendStatus = "rejected";
    contract.pendingExtendDays = 0;
    contract.pendingExtendFee = 0;
    await contract.save();

    try {
      await createNotification({
        recipientId: renterIdVal,
        title: "Gia hạn bị từ chối ❌",
        content: `Chủ đồ không chấp nhận yêu cầu gia hạn "${contract.postId.title}".`,
        type: "EXTEND_REJECTED",
        relatedType: "rental",
        relatedId: contract._id,
        link: "/thue-muon",
      });
    } catch (_) {}

    res.json({ success: true, data: contract, message: "Đã từ chối yêu cầu gia hạn" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Cron job: nhắc sắp hết hạn thuê (gọi mỗi ngày) ─────────────────────────
const sendExpiryReminders = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    const now = new Date();

    const soonExpiring = await RentalContract.find({
      contractStatus: "renting",
      endDate: { $gte: now, $lte: tomorrow },
    }).populate("postId", "title").populate("renterId", "_id fullName");

    for (const contract of soonExpiring) {
      const renterIdVal = contract.renterId?._id || contract.renterId;
      const ownerIdVal  = contract.ownerId?._id  || contract.ownerId;
      const hoursLeft = Math.ceil((contract.endDate - now) / 3600000);
      const msg = `Hợp đồng thuê "${contract.postId?.title}" sẽ hết hạn trong ${hoursLeft} giờ. Vui lòng chuẩn bị trả đồ hoặc gửi yêu cầu gia hạn.`;

      await Promise.allSettled([
        createNotification({ recipientId: renterIdVal, title: "⏰ Sắp hết hạn thuê", content: msg, type: "RENTAL_EXPIRY", relatedType: "rental", relatedId: contract._id, link: "/thue-muon" }),
        createNotification({ recipientId: ownerIdVal, title: "⏰ Hợp đồng sắp hết hạn", content: `Hợp đồng thuê "${contract.postId?.title}" sắp hết hạn trong ${hoursLeft} giờ.`, type: "RENTAL_EXPIRY", relatedType: "rental", relatedId: contract._id, link: "/thue-muon" }),
      ]);
    }
    console.log(`[ExpiryReminder] Đã gửi nhắc cho ${soonExpiring.length} hợp đồng sắp hết hạn`);
  } catch (err) {
    console.error("[ExpiryReminder] Error:", err.message);
  }
};

module.exports = { getRentalAvailability, createRentalRequest, getRental, getMyRentals, getMyLendings, updateRentalStatus, extendRental, confirmExtend, requestReturn, resolveDeposit, sendExpiryReminders };
