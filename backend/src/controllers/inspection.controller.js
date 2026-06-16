const Inspection = require("../models/inspection.model");
const Order = require("../models/order.model");
const Rental = require("../models/rental.model");

const createInspection = async (req, res) => {
  try {
    const { order, rental, inspectionType, productMatch, conditionMatch, accessoriesComplete, frontImage, backImage, accessoriesImage, extraImages, notes, issueType, issueDescription, status } = req.body;
    
    // Validate
    if (!order && !rental) return res.status(400).json({ success: false, message: "Cần order hoặc rental ID" });

    const inspection = await Inspection.create({
      shipper: req.user._id,
      order: order || undefined,
      rental: rental || undefined,
      inspectionType,
      productMatch, conditionMatch, accessoriesComplete,
      frontImage, backImage, accessoriesImage, extraImages,
      notes, issueType, issueDescription, status
    });

    res.status(201).json({ success: true, data: inspection });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getInspection = async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate("shipper", "name phone")
      .populate("order")
      .populate("rental");
    if (!inspection) return res.status(404).json({ success: false, message: "Không tìm thấy biên bản" });
    res.json({ success: true, data: inspection });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getInspectionsByOrder = async (req, res) => {
  try {
    const inspections = await Inspection.find({ order: req.params.orderId })
      .populate("shipper", "name phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: inspections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getInspectionsByRental = async (req, res) => {
  try {
    const inspections = await Inspection.find({ rental: req.params.rentalId })
      .populate("shipper", "name phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: inspections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateInspection = async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    if (inspection.shipper.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Không có quyền" });
    if (inspection.status === "SUBMITTED") return res.status(400).json({ success: false, message: "Biên bản đã nộp không thể sửa" });

    Object.assign(inspection, req.body);
    await inspection.save();
    res.json({ success: true, data: inspection });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminGetAllInspections = async (req, res) => {
  try {
    const { issueType, status } = req.query;
    const filter = {};
    if (issueType) filter.issueType = issueType;
    if (status) filter.status = status;
    
    const inspections = await Inspection.find(filter)
      .populate("shipper", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: inspections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createInspection, getInspection, getInspectionsByOrder, getInspectionsByRental, updateInspection, adminGetAllInspections };
