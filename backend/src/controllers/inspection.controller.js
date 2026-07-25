const DeliveryInspection = require("../models/delivery_inspection.model");
const Delivery = require("../models/delivery.model");
const Order = require("../models/order.model");
const InspectionImage = require("../models/inspection_image.model");
const ProductPost = require("../models/product_post.model");
const MediaFile = require("../models/media_file.model");
const User = require("../models/user.model");
const { normalizeInspectionOutcome, validateInspectionOutcome } = require("../utils/business-rules");
const { createNotification } = require("./notification.controller");
const { releaseOrderInventory } = require("../services/order-inventory.service");

const REQUIRED_IMAGE_TYPES = ["front", "back", "accessories"];
const DELIVERY_STATUS_TO_UI = {
  WAITING_SHIPPER: "pending",
  SHIPPER_ACCEPTED: "accepted",
  PICKING_UP: "picking_up",
  PICKED_UP: "picked_up",
  DELIVERING: "in_transit",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  FAILED: "failed",
};

const getUiDeliveryStatus = (delivery) => DELIVERY_STATUS_TO_UI[delivery?.status] || delivery?.deliveryStatus || "pending";

const canAccessDelivery = async (deliveryId, user) => {
  if (user.role === "admin") return true;
  const delivery = await Delivery.findById(deliveryId).populate("orderId", "buyerId sellerId").lean();
  if (!delivery) return false;
  const userId = String(user._id);
  return String(delivery.shipperId || "") === userId
    || String(delivery.orderId?.buyerId || "") === userId
    || String(delivery.orderId?.sellerId || "") === userId;
};

const attachInspectionImages = async (inspection) => {
  const images = await InspectionImage.find({ inspectionId: inspection._id })
    .populate("mediaId", "publicUrl originalName")
    .lean();
  inspection.images = images.map((image) => ({
    _id: image._id,
    imageType: image.imageType,
    mediaId: image.mediaId?._id || image.mediaId,
    imageUrl: image.mediaId?.publicUrl || null,
  }));
};

const restoreOrderInventory = async (order) => {
  if (!order?.postId) return;
  await ProductPost.findByIdAndUpdate(order.postId, {
    $inc: { quantity: Math.max(Number(order.quantity) || 1, 1) },
    $set: { postStatus: "available" },
  });
};

const getInspectionChecks = (payload) => ({
  isCorrectProduct: payload.isCorrectProduct !== false,
  isCorrectCategoryBrandModel: payload.isCorrectCategoryBrandModel ?? payload.isCorrectModel ?? true,
  isCorrectCondition: payload.isCorrectCondition !== false,
  isCorrectQuantity: payload.isCorrectQuantity !== false,
  isCorrectColorSizeVersion: payload.isCorrectColorSizeVersion !== false,
  isAccessoriesEnough: payload.isAccessoriesEnough !== false,
  hasNoNewDamage: payload.hasNoNewDamage ?? !payload.isDamagedByShipper,
  hasNoCounterfeitSigns: payload.hasNoCounterfeitSigns !== false,
  isSerialMatched: payload.isSerialMatched !== false,
  isCorrectImage: payload.isCorrectImage !== false,
  isBasicFunctionWorking: payload.isBasicFunctionWorking !== false,
});

const CHECK_LABELS = {
  isCorrectProduct: "Dung san pham theo don dang ban",
  isCorrectCategoryBrandModel: "Dung danh muc/thuong hieu/model",
  isCorrectCondition: "Dung tinh trang nhu nguoi ban mo ta",
  isCorrectQuantity: "Dung so luong",
  isCorrectColorSizeVersion: "Dung mau sac/kich thuoc/phien ban",
  isAccessoriesEnough: "Dung phu kien da cam ket",
  hasNoNewDamage: "Khong phat sinh hu hong moi",
  hasNoCounterfeitSigns: "Khong co dau hieu hang gia/hang nhai",
  isSerialMatched: "IMEI/Serial khop thong tin dang ban",
  isCorrectImage: "Hinh thuc ben ngoai phu hop voi anh dang ban",
  isBasicFunctionWorking: "San pham van hoat dong co ban",
};

const getFailedCheckLabels = (checks) => Object.entries(checks)
  .filter(([, value]) => value === false)
  .map(([key]) => CHECK_LABELS[key] || key);

const createInspection = async (req, res) => {
  try {
    const {
      deliveryId,
      inspectionType,
      conditionNote,
      isMatchDescription,
      isDamagedByShipper,
      isCorrectProduct,
      isCorrectImage,
      isCorrectModel,
      isCorrectCategoryBrandModel,
      isCorrectCondition,
      isCorrectQuantity,
      isCorrectColorSizeVersion,
      isAccessoriesEnough,
      hasNoNewDamage,
      hasNoCounterfeitSigns,
      isSerialMatched,
      isBasicFunctionWorking,
      result,
      faultType,
      inspectionImages,
    } = req.body;

    const outcome = normalizeInspectionOutcome(result, faultType);
    const checks = getInspectionChecks({
      isCorrectProduct,
      isCorrectImage,
      isCorrectModel,
      isCorrectCategoryBrandModel,
      isCorrectCondition,
      isCorrectQuantity,
      isCorrectColorSizeVersion,
      isAccessoriesEnough,
      hasNoNewDamage,
      hasNoCounterfeitSigns,
      isSerialMatched,
      isBasicFunctionWorking,
      isDamagedByShipper,
    });

    if (!deliveryId || !inspectionType || !result) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }
    const outcomeError = validateInspectionOutcome({
      ...outcome,
      checks: Object.values(checks),
    });
    if (outcomeError) return res.status(400).json({ success: false, message: outcomeError });

    const normalizedImages = Array.isArray(inspectionImages) ? inspectionImages : [];
    const providedTypes = new Set(normalizedImages.map((image) => image.imageType));
    if (normalizedImages.length !== REQUIRED_IMAGE_TYPES.length || REQUIRED_IMAGE_TYPES.some((type) => !providedTypes.has(type))) {
      return res.status(400).json({
        success: false,
        message: "Bắt buộc có đủ ảnh mặt trước, mặt sau và phụ kiện",
      });
    }

    const mediaIds = normalizedImages.map((image) => image.mediaId);
    if (new Set(mediaIds.map(String)).size !== REQUIRED_IMAGE_TYPES.length) {
      return res.status(400).json({ success: false, message: "Ảnh kiểm định không được trùng lặp" });
    }
    const ownedMediaCount = await MediaFile.countDocuments({
      _id: { $in: mediaIds },
      uploadedBy: req.user._id,
      fileType: "inspection",
    });
    if (ownedMediaCount !== REQUIRED_IMAGE_TYPES.length) {
      return res.status(400).json({ success: false, message: "Ảnh kiểm định không hợp lệ" });
    }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn giao hàng" });
    }

    if (String(delivery.shipperId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền tạo biên bản cho đơn này",
      });
    }

    if (!["picking_up", "picked_up", "ready_for_delivery"].includes(getUiDeliveryStatus(delivery))) {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể lập biên bản khi shipper đang đến điểm lấy hàng và trước khi bắt đầu giao",
      });
    }

    const existingInspection = await DeliveryInspection.findOne({
      deliveryId,
      inspectionType,
    }).lean();
    if (existingInspection) {
      return res.status(400).json({
        success: false,
        message: "Biên bản kiểm tra cho bước này đã tồn tại",
      });
    }

    const inspection = await DeliveryInspection.create({
      deliveryId,
      shipperId: req.user._id,
      inspectionType,
      conditionNote: conditionNote || "",
      isMatchDescription: isMatchDescription ?? checks.isCorrectCondition,
      isDamagedByShipper: !!isDamagedByShipper,
      ...checks,
      isCorrectModel: checks.isCorrectCategoryBrandModel,
      result: outcome.result,
      faultType: outcome.faultType,
    });

    await InspectionImage.insertMany(normalizedImages.map((image) => ({
      inspectionId: inspection._id,
      mediaId: image.mediaId,
      imageType: image.imageType,
    })));

    if (outcome.result === "passed") {
      delivery.status = "PICKED_UP";
      delivery.history.push({
        status: "PICKED_UP",
        note: "Bien ban kiem tra dat tat ca tieu chi. Shipper da nhan hang hop le va san sang giao.",
        changedAt: new Date(),
      });
      await delivery.save();
      req.app.get("io")?.emit("realtime_update", { type: "delivery", relatedType: "delivery", relatedId: delivery._id });
    } else {
      const failedChecks = getFailedCheckLabels(checks);
      delivery.status = "FAILED";
      delivery.failureReason =
        `Kiem tra san pham that bai. Tieu chi khong dat: ${failedChecks.join(", ")}. ${conditionNote || ""}`.trim();
      delivery.history.push({
        status: "FAILED",
        note: delivery.failureReason,
        changedAt: new Date(),
      });
      await delivery.save();
      req.app.get("io")?.emit("realtime_update", { type: "delivery", relatedType: "delivery", relatedId: delivery._id });

      const admins = await User.find({ role: "admin", accountStatus: "active" }).select("_id");
      await Promise.all(admins.map((admin) => createNotification({
        recipientId: admin._id,
        type: "report_update",
        title: "Biên bản kiểm tra thất bại",
        content: `Vận đơn #${String(delivery._id).slice(-8).toUpperCase()} có tiêu chí kiểm tra không đạt và cần Admin xử lý.`,
        relatedType: "System",
        relatedId: null,
        link: "/admin/kiem-dinh",
      }, req.app.get("io"))));

      const order = await Order.findByIdAndUpdate(delivery.orderId, {
        status: "CANCELLED",
        cancelReason: delivery.failureReason,
      }, { new: true })
        .populate("buyerId", "fullName")
        .populate("sellerId", "fullName")
        .populate("postId", "title")
        .lean();

      if (order?.postId) {
        await releaseOrderInventory(delivery.orderId);
      }

      if (order) {
        const io = req.app.get("io");
        const productTitle = order.postId?.title || "sản phẩm";
        await Promise.all([
          createNotification({
            recipientId: order.buyerId?._id || order.buyerId,
            type: "order_update",
            title: "Đơn hàng đã bị hủy (Kiểm tra hàng không đạt)",
            content: `Vận đơn giao "${productTitle}" đã bị hủy do biên bản kiểm tra tại chỗ không đạt: "${delivery.failureReason}". Bấm vào đây để xem chi tiết.`,
            relatedType: "order",
            relatedId: order._id,
            link: `/orders/${order._id}`,
          }, io),
          createNotification({
            recipientId: order.sellerId?._id || order.sellerId,
            type: "order_update",
            title: "Đơn bán đã bị hủy (Kiểm tra hàng không đạt)",
            content: `Vận đơn giao "${productTitle}" đã bị hủy do biên bản kiểm tra tại chỗ không đạt: "${delivery.failureReason}". Sản phẩm đã được hoàn lại vào kho.`,
            relatedType: "order",
            relatedId: order._id,
            link: `/orders/${order._id}`,
          }, io),
        ]);
      }
    }

    const populatedInspection = await DeliveryInspection.findById(inspection._id)
      .populate("shipperId", "fullName phone")
      .populate({
        path: "deliveryId",
        populate: {
          path: "orderId",
          populate: { path: "postId", select: "title" },
        },
      })
      .lean();
    await attachInspectionImages(populatedInspection);

    res.status(201).json({
      success: true,
      message: "Tạo biên bản kiểm tra thành công",
      data: populatedInspection,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInspectionsByDelivery = async (req, res) => {
  try {
    if (!(await canAccessDelivery(req.params.deliveryId, req.user))) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem biên bản này" });
    }
    const inspections = await DeliveryInspection.find({
      deliveryId: req.params.deliveryId,
    })
      .populate("shipperId", "fullName phone")
      .sort({ createdAt: -1 })
      .lean();

    for (const inspection of inspections) {
      await attachInspectionImages(inspection);
    }

    res.json({ success: true, data: inspections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInspectionById = async (req, res) => {
  try {
    const inspection = await DeliveryInspection.findById(req.params.id)
      .populate("shipperId", "fullName phone email")
      .populate({
        path: "deliveryId",
        populate: [
          {
            path: "orderId",
            populate: [
              { path: "buyerId", select: "fullName phone" },
              { path: "sellerId", select: "fullName phone" },
              { path: "postId", select: "title salePrice" },
            ],
          },
        ],
      })
      .lean();

    if (!inspection) {
      return res.status(404).json({ success: false, message: "Không tìm thấy biên bản kiểm tra" });
    }


    const deliveryId = inspection.deliveryId?._id || inspection.deliveryId;
    if (!(await canAccessDelivery(deliveryId, req.user))) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem biên bản này" });
    }

    await attachInspectionImages(inspection);

    res.json({ success: true, data: inspection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyInspections = async (req, res) => {
  try {
    const inspections = await DeliveryInspection.find({ shipperId: req.user._id })
      .populate({
        path: "deliveryId",
        populate: {
          path: "orderId",
          populate: { path: "postId", select: "title" },
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    for (const inspection of inspections) {
      await attachInspectionImages(inspection);
    }

    res.json({ success: true, data: inspections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createInspection,
  getInspectionsByDelivery,
  getInspectionById,
  getMyInspections,
};
