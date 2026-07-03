const DeliveryInspection = require("../models/delivery_inspection.model");
const Delivery = require("../models/delivery.model");
const Order = require("../models/order.model");
const InspectionImage = require("../models/inspection_image.model");
const ProductPost = require("../models/product_post.model");
const MediaFile = require("../models/media_file.model");
const { normalizeInspectionOutcome, validateInspectionOutcome } = require("../utils/business-rules");

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
      isCorrectCondition,
      isAccessoriesEnough,
      result,
      faultType,
      inspectionImages,
    } = req.body;

    const outcome = normalizeInspectionOutcome(result, faultType);

    if (!deliveryId || !inspectionType || !result) {
      return res.status(400).json({
        success: false,
        message: "Vui long dien day du thong tin",
      });
    }
    const outcomeError = validateInspectionOutcome({
      ...outcome,
      checks: [isCorrectProduct, isCorrectImage, isCorrectModel, isCorrectCondition, isAccessoriesEnough],
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

    if (!["picked_up", "in_transit"].includes(delivery.deliveryStatus)) {
      return res.status(400).json({
        success: false,
        message: "Chi co the lap bien ban sau khi da lay hang",
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
      isMatchDescription: isMatchDescription !== false,
      isDamagedByShipper: !!isDamagedByShipper,
      isCorrectProduct: isCorrectProduct !== false,
      isCorrectImage: isCorrectImage !== false,
      isCorrectModel: isCorrectModel !== false,
      isCorrectCondition: isCorrectCondition !== false,
      isAccessoriesEnough: isAccessoriesEnough !== false,
      result: outcome.result,
      faultType: outcome.faultType,
    });

    await InspectionImage.insertMany(normalizedImages.map((image) => ({
      inspectionId: inspection._id,
      mediaId: image.mediaId,
      imageType: image.imageType,
    })));

    if (outcome.result === "failed") {
      delivery.deliveryStatus = "failed";
      delivery.failureReason =
        outcome.faultType === "seller"
          ? "San pham khong dung mo ta cua seller."
          : "San pham bi hu hong trong qua trinh xu ly cua shipper.";
      delivery.history.push({
        status: "failed",
        note: delivery.failureReason,
        timestamp: new Date(),
      });
      await delivery.save();

      const order = await Order.findByIdAndUpdate(delivery.orderId, {
        orderStatus: "cancelled",
        cancelReason: delivery.failureReason,
      }, { new: true }).lean();

      await restoreOrderInventory(order);
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
