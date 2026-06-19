const DeliveryInspection = require("../models/delivery_inspection.model");
const RentalInspection = require("../models/rental_inspection.model");
const Delivery = require("../models/delivery.model");

const createInspection = async (req, res) => {
  try {
    const {
      deliveryId,
      rentalContractId,
      inspectionType,
      isCorrectProduct,
      isCorrectImage,
      isCorrectModel,
      isCorrectCondition,
      isAccessoriesEnough,
      isMatchDescription,
      conditionNote,
      result,
      isDamagedByShipper,
    } = req.body;

    if (rentalContractId) {
      const inspection = await RentalInspection.create({
        contractId: rentalContractId,
        inspectorId: req.user._id,
        inspectionType: inspectionType || "handover",
        conditionNote: conditionNote || "",
        damageNote: conditionNote || "",
      });
      return res.status(201).json({ success: true, data: inspection });
    } else if (deliveryId) {
      // Kiểm tra xem shipper có phải là người nhận đơn này không
      const delivery = await Delivery.findById(deliveryId);
      if (!delivery) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn giao hàng" });
      }

      if (delivery.shipperId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền tạo biên bản cho đơn này" });
      }

      const inspection = await DeliveryInspection.create({
        deliveryId: deliveryId,
        shipperId: req.user._id,
        inspectionType: inspectionType || "pickup",
        isCorrectProduct: isCorrectProduct !== undefined ? isCorrectProduct : true,
        isCorrectImage: isCorrectImage !== undefined ? isCorrectImage : true,
        isCorrectModel: isCorrectModel !== undefined ? isCorrectModel : true,
        isCorrectCondition: isCorrectCondition !== undefined ? isCorrectCondition : true,
        isAccessoriesEnough: isAccessoriesEnough !== undefined ? isAccessoriesEnough : true,
        isMatchDescription: isMatchDescription !== undefined ? isMatchDescription : true,
        conditionNote: conditionNote || "",
        result: result || "passed",
        isDamagedByShipper: isDamagedByShipper !== undefined ? isDamagedByShipper : false,
      });

      return res.status(201).json({ success: true, data: inspection });
    } else {
      return res.status(400).json({ success: false, message: "Cần deliveryId hoặc rentalContractId" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getInspection = async (req, res) => {
  try {
    let inspection = await RentalInspection.findById(req.params.id)
      .populate("inspectorId", "fullName phone")
      .populate("contractId");

    if (!inspection) {
      inspection = await DeliveryInspection.findById(req.params.id)
        .populate("shipperId", "fullName phone")
        .populate("deliveryId");
    }

    if (!inspection) return res.status(404).json({ success: false, message: "Không tìm thấy biên bản" });
    res.json({ success: true, data: inspection });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getInspectionsByOrder = async (req, res) => {
  try {
    // Tìm delivery theo orderId
    const delivery = await Delivery.findOne({ orderId: req.params.orderId });
    if (!delivery) {
      return res.json({ success: true, data: [] });
    }

    const inspections = await DeliveryInspection.find({ deliveryId: delivery._id })
      .populate("shipperId", "fullName phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: inspections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getInspectionsByRental = async (req, res) => {
  try {
    const inspections = await RentalInspection.find({ contractId: req.params.rentalId })
      .populate("inspectorId", "fullName phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: inspections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateInspection = async (req, res) => {
  try {
    const {
      conditionNote,
      isCorrectProduct,
      isCorrectImage,
      isCorrectModel,
      isCorrectCondition,
      isAccessoriesEnough,
      isMatchDescription,
      result,
      isDamagedByShipper,
    } = req.body;

    let isRental = true;
    let inspection = await RentalInspection.findById(req.params.id);

    if (!inspection) {
      isRental = false;
      inspection = await DeliveryInspection.findById(req.params.id);
    }

    if (!inspection) return res.status(404).json({ success: false, message: "Không tìm thấy" });

    const ownerField = isRental ? inspection.inspectorId : inspection.shipperId;
    if (ownerField.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Không có quyền" });

    if (isRental) {
      if (conditionNote) inspection.conditionNote = conditionNote;
      if (conditionNote) inspection.damageNote = conditionNote;
    } else {
      if (conditionNote !== undefined) inspection.conditionNote = conditionNote;
      if (isCorrectProduct !== undefined) inspection.isCorrectProduct = isCorrectProduct;
      if (isCorrectImage !== undefined) inspection.isCorrectImage = isCorrectImage;
      if (isCorrectModel !== undefined) inspection.isCorrectModel = isCorrectModel;
      if (isCorrectCondition !== undefined) inspection.isCorrectCondition = isCorrectCondition;
      if (isAccessoriesEnough !== undefined) inspection.isAccessoriesEnough = isAccessoriesEnough;
      if (isMatchDescription !== undefined) inspection.isMatchDescription = isMatchDescription;
      if (result !== undefined) inspection.result = result;
      if (isDamagedByShipper !== undefined) inspection.isDamagedByShipper = isDamagedByShipper;
    }

    await inspection.save();
    res.json({ success: true, data: inspection });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminGetAllInspections = async (req, res) => {
  try {
    const rentalInspections = await RentalInspection.find()
      .populate("inspectorId", "fullName")
      .sort({ createdAt: -1 }).lean();

    const deliveryInspections = await DeliveryInspection.find()
      .populate("shipperId", "fullName")
      .sort({ createdAt: -1 }).lean();

    const combined = [...rentalInspections, ...deliveryInspections].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: combined });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createInspection,
  getInspection,
  getInspectionsByOrder,
  getInspectionsByRental,
  updateInspection,
  adminGetAllInspections,
};
