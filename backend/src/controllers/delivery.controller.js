const Delivery = require("../models/delivery.model");
const Order = require("../models/order.model");
const DeliveryInspection = require("../models/delivery_inspection.model");
const ProductImage = require("../models/product_image.model");

/**
 * @desc    Get available deliveries for shippers (not assigned yet)
 * @route   GET /api/deliveries/available
 * @access  Private (Shipper only)
 */
const getAvailableDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({ 
      shipperId: null, 
      deliveryStatus: "pending" 
    })
      .populate({
        path: "orderId",
        populate: [
          { path: "buyerId", select: "fullName phone" },
          { path: "sellerId", select: "fullName phone address" },
          { path: "postId", select: "title salePrice" }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();

    // Get product images
    for (let delivery of deliveries) {
      if (delivery.orderId && delivery.orderId.postId) {
        const image = await ProductImage.findOne({ 
          productPostId: delivery.orderId.postId._id 
        })
          .select("imageUrl")
          .lean();
        delivery.orderId.productImage = image?.imageUrl || null;
      }
    }

    res.json({ success: true, data: deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Accept delivery (shipper accepts the delivery)
 * @route   POST /api/deliveries/:id/accept
 * @access  Private (Shipper only)
 */
const acceptDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn giao hàng" });
    }

    if (delivery.shipperId) {
      return res.status(400).json({ 
        success: false, 
        message: "Đơn này đã có shipper nhận" 
      });
    }

    delivery.shipperId = req.user._id;
    delivery.deliveryStatus = "picking_up";
    await delivery.save();

    // Update order status
    await Order.findByIdAndUpdate(delivery.orderId, {
      orderStatus: "shipping"
    });

    const updatedDelivery = await Delivery.findById(delivery._id)
      .populate("shipperId", "fullName phone")
      .populate({
        path: "orderId",
        populate: [
          { path: "buyerId", select: "fullName phone" },
          { path: "sellerId", select: "fullName phone address" },
          { path: "postId", select: "title salePrice" }
        ]
      })
      .lean();

    res.json({ 
      success: true, 
      message: "Đã nhận đơn giao hàng",
      data: updatedDelivery 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get my deliveries (shipper's assigned deliveries)
 * @route   GET /api/deliveries/my-deliveries
 * @access  Private (Shipper only)
 */
const getMyDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = { shipperId: req.user._id };
    if (status) {
      filter.deliveryStatus = status;
    }

    const deliveries = await Delivery.find(filter)
      .populate({
        path: "orderId",
        populate: [
          { path: "buyerId", select: "fullName phone address" },
          { path: "sellerId", select: "fullName phone address" },
          { path: "postId", select: "title salePrice" }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();

    // Get product images
    for (let delivery of deliveries) {
      if (delivery.orderId && delivery.orderId.postId) {
        const image = await ProductImage.findOne({ 
          productPostId: delivery.orderId.postId._id 
        })
          .select("imageUrl")
          .lean();
        delivery.orderId.productImage = image?.imageUrl || null;
      }
    }

    res.json({ success: true, data: deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get delivery by ID
 * @route   GET /api/deliveries/:id
 * @access  Private
 */
const getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate("shipperId", "fullName phone email")
      .populate({
        path: "orderId",
        populate: [
          { path: "buyerId", select: "fullName phone address email" },
          { path: "sellerId", select: "fullName phone address email" },
          { path: "postId" }
        ]
      })
      .lean();

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn giao hàng" });
    }

    // Check permission
    const isShipper = String(delivery.shipperId?._id) === String(req.user._id);
    const isBuyer = delivery.orderId && String(delivery.orderId.buyerId._id) === String(req.user._id);
    const isSeller = delivery.orderId && String(delivery.orderId.sellerId._id) === String(req.user._id);
    
    if (!isShipper && !isBuyer && !isSeller && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Bạn không có quyền xem đơn giao hàng này" 
      });
    }

    // Get product images
    if (delivery.orderId && delivery.orderId.postId) {
      const images = await ProductImage.find({ 
        productPostId: delivery.orderId.postId._id 
      })
        .select("imageUrl displayOrder")
        .sort({ displayOrder: 1 })
        .lean();
      delivery.orderId.postId.images = images.map(img => img.imageUrl);
    }

    // Get inspection reports
    const inspections = await DeliveryInspection.find({ deliveryId: delivery._id })
      .populate("shipperId", "fullName phone")
      .lean();
    delivery.inspections = inspections;

    res.json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update delivery status
 * @route   PATCH /api/deliveries/:id/status
 * @access  Private (Shipper only)
 */
const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn giao hàng" });
    }

    if (String(delivery.shipperId) !== String(req.user._id)) {
      return res.status(403).json({ 
        success: false, 
        message: "Bạn không có quyền cập nhật đơn này" 
      });
    }

    const validTransitions = {
      "picking_up": ["in_transit", "failed"],
      "in_transit": ["delivered", "failed"],
      "delivered": [] // Cannot change from delivered
    };

    const currentStatus = delivery.deliveryStatus;
    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Không thể chuyển sang trạng thái này" 
      });
    }

    delivery.deliveryStatus = status;
    await delivery.save();

    // Update order status accordingly
    if (status === "delivered") {
      await Order.findByIdAndUpdate(delivery.orderId, {
        orderStatus: "delivered"
      });
    } else if (status === "failed") {
      await Order.findByIdAndUpdate(delivery.orderId, {
        orderStatus: "cancelled"
      });
    }

    const updatedDelivery = await Delivery.findById(delivery._id)
      .populate("shipperId", "fullName phone")
      .populate({
        path: "orderId",
        populate: [
          { path: "buyerId", select: "fullName phone" },
          { path: "sellerId", select: "fullName phone" },
          { path: "postId", select: "title" }
        ]
      })
      .lean();

    res.json({ 
      success: true, 
      message: "Cập nhật trạng thái thành công",
      data: updatedDelivery 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAvailableDeliveries,
  acceptDelivery,
  getMyDeliveries,
  getDeliveryById,
  updateDeliveryStatus
};
