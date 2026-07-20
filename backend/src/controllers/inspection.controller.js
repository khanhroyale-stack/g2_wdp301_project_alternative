const DeliveryInspection = require("../models/delivery_inspection.model");
const Delivery = require("../models/delivery.model");
const Order = require("../models/order.model");
const InspectionImage = require("../models/inspection_image.model");
const ProductPost = require("../models/product_post.model");
const MediaFile = require("../models/media_file.model");
const User = require("../models/user.model");
const { normalizeInspectionOutcome, validateInspectionOutcome } = require("../utils/business-rules");
const { createNotification } = require("./notification.controller");

const REQUIRED_IMAGE_TYPES = ["front", "back", "accessories"];

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
        message: "Vui long dien day du thong tin",
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
        message: "Bat buoc co du anh mat truoc, mat sau va phu kien",
      });
    }

    const mediaIds = normalizedImages.map((image) => image.mediaId);
    if (new Set(mediaIds.map(String)).size !== REQUIRED_IMAGE_TYPES.length) {
      return res.status(400).json({ success: false, message: "Anh kiem dinh khong duoc trung lap" });
    }
    const ownedMediaCount = await MediaFile.countDocuments({
      _id: { $in: mediaIds },
      uploadedBy: req.user._id,
      fileType: "inspection",
    });
    if (ownedMediaCount !== REQUIRED_IMAGE_TYPES.length) {
      return res.status(400).json({ success: false, message: "Anh kiem dinh khong hop le" });
    }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ success: false, message: "Khong tim thay don giao hang" });
    }

    if (String(delivery.shipperId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen tao bien ban cho don nay",
      });
    }

    if (!["picking_up", "picked_up", "ready_for_delivery"].includes(delivery.deliveryStatus)) {
      return res.status(400).json({
        success: false,
        message: "Chi co the lap bien ban khi shipper dang den diem lay hang va truoc khi bat dau giao",
      });
    }

    const existingInspection = await DeliveryInspection.findOne({
      deliveryId,
      inspectionType,
    }).lean();
    if (existingInspection) {
      return res.status(400).json({
        success: false,
        message: "Bien ban kiem tra cho buoc nay da ton tai",
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
      delivery.deliveryStatus = "received";
      delivery.history.push({
        status: "received",
        note: "Bien ban kiem tra dat tat ca tieu chi. Shipper da nhan hang hop le va san sang giao.",
        timestamp: new Date(),
      });
      await delivery.save();
      req.app.get("io")?.emit("realtime_update", { type: "delivery", relatedType: "delivery", relatedId: delivery._id });
    } else {
      const failedChecks = getFailedCheckLabels(checks);
      delivery.deliveryStatus = "inspection_failed";
      delivery.failureReason =
        `Kiem tra san pham that bai. Tieu chi khong dat: ${failedChecks.join(", ")}. ${conditionNote || ""}`.trim();
      delivery.history.push({
        status: "inspection_failed",
        note: delivery.failureReason,
        timestamp: new Date(),
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
      message: "Tao bien ban kiem tra thanh cong",
      data: populatedInspection,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInspectionsByDelivery = async (req, res) => {
  try {
    if (!(await canAccessDelivery(req.params.deliveryId, req.user))) {
      return res.status(403).json({ success: false, message: "Ban khong co quyen xem bien ban nay" });
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
      return res.status(404).json({ success: false, message: "Khong tim thay bien ban kiem tra" });
    }


    const deliveryId = inspection.deliveryId?._id || inspection.deliveryId;
    if (!(await canAccessDelivery(deliveryId, req.user))) {
      return res.status(403).json({ success: false, message: "Ban khong co quyen xem bien ban nay" });
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
