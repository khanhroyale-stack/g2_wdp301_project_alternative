const DeliveryInspection = require("../models/delivery_inspection.model");
const Delivery = require("../models/delivery.model");
const Order = require("../models/order.model");
const InspectionImage = require("../models/inspection_image.model");
const ProductPost = require("../models/product_post.model");

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
    } = req.body;

    if (!deliveryId || !inspectionType || !result) {
      return res.status(400).json({
        success: false,
        message: "Vui long dien day du thong tin",
      });
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
      result,
    });

    if (result !== "passed") {
      delivery.deliveryStatus = "failed";
      delivery.failureReason =
        result === "failed_seller_fault"
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

      if (order?.postId) {
        await ProductPost.findByIdAndUpdate(order.postId, {
          postStatus: "approved",
        });
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
    const inspections = await DeliveryInspection.find({
      deliveryId: req.params.deliveryId,
    })
      .populate("shipperId", "fullName phone")
      .sort({ createdAt: -1 })
      .lean();

    for (const inspection of inspections) {
      const images = await InspectionImage.find({ inspectionId: inspection._id })
        .select("imageUrl description")
        .lean();
      inspection.images = images;
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

    const images = await InspectionImage.find({ inspectionId: inspection._id })
      .select("imageUrl description")
      .lean();
    inspection.images = images;

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
      const images = await InspectionImage.find({ inspectionId: inspection._id })
        .select("imageUrl description")
        .lean();
      inspection.images = images;
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
