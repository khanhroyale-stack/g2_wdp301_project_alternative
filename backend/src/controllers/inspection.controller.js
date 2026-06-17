const DeliveryInspection = require("../models/delivery_inspection.model");
const Delivery = require("../models/delivery.model");
const InspectionImage = require("../models/inspection_image.model");

/**
 * @desc    Create inspection report
 * @route   POST /api/inspections
 * @access  Private (Shipper only)
 */
const createInspection = async (req, res) => {
  try {
    const { 
      deliveryId, 
      inspectionType, 
      conditionNote, 
      isMatchDescription,
      isDamagedByShipper 
    } = req.body;

    if (!deliveryId || !inspectionType) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng điền đầy đủ thông tin" 
      });
    }

    // Check delivery exists and shipper owns it
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn giao hàng" });
    }

    if (String(delivery.shipperId) !== String(req.user._id)) {
      return res.status(403).json({ 
        success: false, 
        message: "Bạn không có quyền tạo biên bản cho đơn này" 
      });
    }

    const inspection = await DeliveryInspection.create({
      deliveryId,
      shipperId: req.user._id,
      inspectionType, // "pickup" or "receive"
      conditionNote: conditionNote || "",
      isMatchDescription: isMatchDescription !== false,
      isDamagedByShipper: isDamagedByShipper || false
    });

    const populatedInspection = await DeliveryInspection.findById(inspection._id)
      .populate("shipperId", "fullName phone")
      .populate({
        path: "deliveryId",
        populate: {
          path: "orderId",
          populate: { path: "postId", select: "title" }
        }
      })
      .lean();

    res.status(201).json({ 
      success: true, 
      message: "Tạo biên bản kiểm tra thành công",
      data: populatedInspection 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get inspections for a delivery
 * @route   GET /api/inspections/delivery/:deliveryId
 * @access  Private
 */
const getInspectionsByDelivery = async (req, res) => {
  try {
    const inspections = await DeliveryInspection.find({ 
      deliveryId: req.params.deliveryId 
    })
      .populate("shipperId", "fullName phone")
      .sort({ createdAt: -1 })
      .lean();

    // Get images for each inspection
    for (let inspection of inspections) {
      const images = await InspectionImage.find({ 
        inspectionId: inspection._id 
      })
        .select("imageUrl description")
        .lean();
      inspection.images = images;
    }

    res.json({ success: true, data: inspections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get inspection by ID
 * @route   GET /api/inspections/:id
 * @access  Private
 */
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
              { path: "postId", select: "title salePrice" }
            ]
          }
        ]
      })
      .lean();

    if (!inspection) {
      return res.status(404).json({ success: false, message: "Không tìm thấy biên bản kiểm tra" });
    }

    // Get images
    const images = await InspectionImage.find({ inspectionId: inspection._id })
      .select("imageUrl description")
      .lean();
    inspection.images = images;

    res.json({ success: true, data: inspection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get my inspections (shipper's inspections)
 * @route   GET /api/inspections/my-inspections
 * @access  Private (Shipper only)
 */
const getMyInspections = async (req, res) => {
  try {
    const inspections = await DeliveryInspection.find({ shipperId: req.user._id })
      .populate({
        path: "deliveryId",
        populate: {
          path: "orderId",
          populate: { path: "postId", select: "title" }
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Get images
    for (let inspection of inspections) {
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
  getMyInspections
};
