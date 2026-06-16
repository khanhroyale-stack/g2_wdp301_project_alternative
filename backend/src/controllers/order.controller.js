const Order = require("../models/order.model");
const Product = require("../models/product.model");
const { createNotification } = require("./notification.controller");

const createOrder = async (req, res) => {
  try {
    const product = await Product.findById(req.body.productId).populate("seller", "name");
    if (!product || product.status !== "ACTIVE")
      return res.status(400).json({ success: false, message: "Sản phẩm không còn khả dụng" });

    if (product.seller._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: "Không thể mua sản phẩm của chính mình" });

    const order = await Order.create({
      buyer: req.user._id,
      seller: product.seller._id,
      product: product._id,
      totalAmount: product.salePrice + (req.body.shippingFee || 0),
      shippingFee: req.body.shippingFee || 0,
      note: req.body.note || "",
      deliveryAddress: req.body.deliveryAddress || "",
      statusHistory: [{ status: "PENDING", changedBy: req.user._id }],
    });

    // Thông báo cho seller
    await createNotification({
      recipientId: product.seller._id,
      title: "Có đơn hàng mới 🛍️",
      message: `Bạn có đơn hàng mới cho sản phẩm "${product.title}". Vui lòng xác nhận.`,
      type: "NEW_ORDER",
      link: "/don-hang",
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("product", "title images salePrice")
      .populate("seller", "name avatar phone")
      .populate("shipper", "name phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMySales = async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user._id })
      .populate("product", "title images salePrice")
      .populate("buyer", "name avatar phone")
      .populate("shipper", "name phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("product")
      .populate("buyer", "name avatar phone")
      .populate("seller", "name avatar phone")
      .populate("shipper", "name phone avatar");
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const order = await Order.findById(req.params.id)
      .populate("buyer", "name _id")
      .populate("seller", "name _id")
      .populate("product", "title");
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    order.status = status;
    order.statusHistory.push({ status, changedBy: req.user._id, note: reason || "" });

    if (status === "CANCELLED") {
      order.cancelledBy = req.user._id;
      order.cancelledReason = reason || "";
    }
    if (status === "SELLER_CONFIRMED") {
      // Thông báo buyer
      await createNotification({
        recipientId: order.buyer._id,
        title: "Người bán đã xác nhận đơn hàng ✅",
        message: `Đơn hàng "${order.product?.title}" đã được người bán xác nhận. Shipper sẽ sớm lấy hàng.`,
        type: "ORDER_CONFIRMED",
        link: "/don-hang",
      });
    }
    if (status === "COMPLETED") {
      await Product.findByIdAndUpdate(order.product._id || order.product, { status: "SOLD" });
      // Thông báo seller + buyer
      await createNotification({
        recipientId: order.seller._id,
        title: "Đơn hàng hoàn tất 🎉",
        message: `Đơn hàng "${order.product?.title}" đã hoàn tất.`,
        type: "DELIVERY_COMPLETED",
        link: "/don-hang",
      });
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Shipper ──────────────────────────────────────────
const shipperGetAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: "SELLER_CONFIRMED", shipper: { $exists: false } })
      .populate("product", "title images condition")
      .populate("buyer", "name phone")
      .populate("seller", "name phone")
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const shipperAcceptOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: "SELLER_CONFIRMED", shipper: { $exists: false } },
      {
        shipper: req.user._id,
        status: "PICKING_UP",
        $push: { statusHistory: { status: "PICKING_UP", changedBy: req.user._id } },
      },
      { new: true }
    ).populate("buyer seller product");
    if (!order) return res.status(400).json({ success: false, message: "Đơn hàng không khả dụng" });

    await createNotification({
      recipientId: order.buyer._id,
      title: "Shipper đang đến lấy hàng 🚚",
      message: `Shipper đang trên đường đến lấy hàng cho đơn "${order.product?.title}".`,
      type: "DELIVERY_ASSIGNED",
      link: "/don-hang",
    });
    await createNotification({
      recipientId: order.seller._id,
      title: "Shipper đang đến lấy hàng 🚚",
      message: `Shipper đang trên đường đến lấy sản phẩm "${order.product?.title}".`,
      type: "DELIVERY_ASSIGNED",
      link: "/don-hang",
    });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const shipperUpdateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowedStatuses = ["PICKING_UP", "PICKED_UP", "DELIVERING", "DELIVERED", "COMPLETED"];
    if (!allowedStatuses.includes(status))
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });

    const order = await Order.findOne({ _id: req.params.id, shipper: req.user._id })
      .populate("buyer seller product");
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    order.status = status;
    order.statusHistory.push({ status, changedBy: req.user._id, note: note || "" });

    if (status === "DELIVERED") {
      await createNotification({
        recipientId: order.buyer._id,
        title: "Hàng đã được giao 📦",
        message: `Đơn hàng "${order.product?.title}" đã được giao thành công. Vui lòng xác nhận.`,
        type: "DELIVERY_COMPLETED",
        link: "/don-hang",
      });
    }
    if (status === "COMPLETED") {
      await Product.findByIdAndUpdate(order.product._id || order.product, { status: "SOLD" });
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const shipperGetMyDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { shipper: req.user._id };
    if (status) filter.status = status;
    const orders = await Order.find(filter)
      .populate("product", "title images condition")
      .populate("buyer", "name phone")
      .populate("seller", "name phone")
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createOrder, getMyOrders, getMySales, getOrder, updateOrderStatus,
  shipperGetAvailableOrders, shipperAcceptOrder, shipperUpdateStatus, shipperGetMyDeliveries,
};
