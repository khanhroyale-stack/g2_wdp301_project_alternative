const DeliveryInspection = require("../models/delivery_inspection.model");
const RentalInspection = require("../models/rental_inspection.model");

const createInspection = async (req, res) => {
  try {
    const { order, rental, inspectionType, notes, issueDescription } = req.body;
    
    if (rental) {
        const inspection = await RentalInspection.create({
            contractId: rental,
            inspectorId: req.user._id,
            inspectionType: inspectionType === 'pre_rental' ? 'handover' : 'return',
            conditionNote: notes,
            damageNote: issueDescription
        });
        return res.status(201).json({ success: true, data: inspection });
    } else if (order) {
        const inspection = await DeliveryInspection.create({
            deliveryId: order, // Assuming order id maps to delivery
            shipperId: req.user._id,
            inspectionType: inspectionType === 'pre_delivery' ? 'pickup' : 'receive',
            conditionNote: notes,
            isDamagedByShipper: false // Set based on issueType if needed
        });
        return res.status(201).json({ success: true, data: inspection });
    } else {
        return res.status(400).json({ success: false, message: "Cần order hoặc rental ID" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getInspection = async (req, res) => {
  try {
    let inspection = await RentalInspection.findById(req.params.id)
      .populate("inspectorId", "name phone")
      .populate("contractId");
      
    if (!inspection) {
        inspection = await DeliveryInspection.findById(req.params.id)
          .populate("shipperId", "name phone")
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
    const inspections = await DeliveryInspection.find({ deliveryId: req.params.orderId })
      .populate("shipperId", "name phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: inspections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getInspectionsByRental = async (req, res) => {
  try {
    const inspections = await RentalInspection.find({ contractId: req.params.rentalId })
      .populate("inspectorId", "name phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: inspections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateInspection = async (req, res) => {
  try {
    const { notes, issueDescription } = req.body;
    let isRental = true;
    let inspection = await RentalInspection.findById(req.params.id);
    
    if (!inspection) {
        isRental = false;
        inspection = await DeliveryInspection.findById(req.params.id);
    }
    
    if (!inspection) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    
    const ownerField = isRental ? inspection.inspectorId : inspection.shipperId;
    if (ownerField.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Không có quyền" });

    if (isRental) {
        if (notes) inspection.conditionNote = notes;
        if (issueDescription) inspection.damageNote = issueDescription;
    } else {
        if (notes) inspection.conditionNote = notes;
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
      .populate("inspectorId", "name")
      .sort({ createdAt: -1 }).lean();
      
    const deliveryInspections = await DeliveryInspection.find()
      .populate("shipperId", "name")
      .sort({ createdAt: -1 }).lean();
      
    const combined = [...rentalInspections, ...deliveryInspections].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, data: combined });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createInspection, getInspection, getInspectionsByOrder, getInspectionsByRental, updateInspection, adminGetAllInspections };
