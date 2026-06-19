const Order = require("../models/order.model");
const ProductPost = require("../models/product_post.model");
const ProductImage = require("../models/product_image.model");
const Delivery = require("../models/delivery.model");
const { createNotification } = require("./notification.controller");

const getCheckoutPreview = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.params.productId).populate("ownerId", "fullName phone avatar address");
    if (!product || product.postStatus !== "approved") {
      return res.status(400).json({ success: false, message: "Sản phẩm không còn khả dụng" });
    }

    const images = await ProductImage.find({ productPostId: product._id }).populate("field", "publicUrl").sort({ isThumbnail: -1, displayOrder: 1 });
    const imageUrls = images.map((img) => img.field?.publicUrl || img.imageUrl).filter(Boolean);

    const shippingFee = 0;
    const subtotal = product.salePrice;
    const totalAmount = subtotal + shippingFee;

    res.json({
      success: true,
      data: {
        product: {
          ...product.toObject(),
          images: imageUrls,
          salePrice: product.salePrice,
        },
        buyer: req.user,
        subtotal,
        shippingFee,
        totalAmount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.body.productId).populate("ownerId", "fullName phone address");
    if (!product || product.postStatus !== "approved") {
      return res.status(400).json({ success: false, message: "Sản phẩm không còn khả dụng" });
    }

    if (product.ownerId._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Không thể mua sản phẩm của chính mình" });
    }

    const shippingFee = 0;
    const productPrice = product.salePrice;
    const totalAmount = productPrice + shippingFee;

    const order = await Order.create({
      buyerId: req.user._id,
      sellerId: product.ownerId._id,
      postId: product._id,
      productPrice,
      shippingFee,
      totalAmount,
      buyerAddress: req.body.buyerAddress || req.user.address,
      buyerPhone: req.body.buyerPhone || req.user.phone,
      recipientName: req.body.recipientName || req.user.fullName,
      note: req.body.note || "",
      orderStatus: "pending",
    });

    // Thông báo cho seller
    const io = req.app.get("io");
    await createNotification({
      recipientId: product.ownerId._id,
      type: "system",
      title: "Có đơn hàng mới 🛍️",
      content: `Bạn có đơn hàng mới cho sản phẩm "${product.title}". Vui lòng xác nhận.`,
      link: "/don-hang",
    }, io);

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .populate("postId", "title salePrice")
      .populate("sellerId", "fullName avatar phone address")
      .populate("buyerId", "fullName phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMySales = async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.user._id })
      .populate("postId", "title salePrice")
      .populate("buyerId", "fullName avatar phone address")
      .populate("sellerId", "fullName phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("postId")
      .populate("buyerId", "fullName avatar phone address")
      .populate("sellerId", "fullName avatar phone address");
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sellerConfirmOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("postId", "title").populate("buyerId");
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xác nhận đơn hàng này" });
    }

    order.orderStatus = "confirmed";
    await order.save();

    // Tạo đơn giao hàng
    const product = await ProductPost.findById(order.postId);
    const delivery = await Delivery.create({
      orderId: order._id,
      pickupAddress: product.location,
      deliveryAddress: order.buyerAddress,
      deliveryFee: 0,
      deliveryType: "standard",
      deliveryStatus: "pending",
    });

    // Thông báo cho buyer
    const io = req.app.get("io");
    await createNotification({
      recipientId: order.buyerId._id,
      type: "system",
      title: "Đơn hàng đã được xác nhận ✅",
      content: `Đơn hàng "${order.postId.title}" đã được người bán xác nhận.`,
      link: "/don-hang",
    }, io);

    res.json({ success: true, data: order, delivery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sellerRejectOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("postId", "title").populate("buyerId");
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền từ chối đơn hàng này" });
    }

    order.orderStatus = "cancelled";
    order.cancelReason = req.body.reason || "Người bán từ chối đơn hàng";
    await order.save();

    // Thông báo cho buyer
    const io = req.app.get("io");
    await createNotification({
      recipientId: order.buyerId._id,
      type: "system",
      title: "Đơn hàng đã bị từ chối ❌",
      content: `Đơn hàng "${order.postId.title}" đã bị người bán từ chối.`,
      link: "/don-hang",
    }, io);

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("postId", "title");
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (order.buyerId.toString() !== req.user._id.toString() && order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền hủy đơn hàng này" });
    }

    if (!["pending", "confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: "Không thể hủy đơn hàng ở trạng thái này" });
    }

    order.orderStatus = "cancelled";
    order.cancelReason = req.body.reason || "Đơn hàng bị hủy";
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const buyerConfirmDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("postId", "title").populate("sellerId");
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xác nhận đơn hàng này" });
    }

    if (order.orderStatus !== "delivered") {
      return res.status(400).json({ success: false, message: "Đơn hàng chưa được giao" });
    }

    order.orderStatus = "completed";
    await order.save();

    // Cập nhật sản phẩm thành đã bán
    await ProductPost.findByIdAndUpdate(order.postId, { postStatus: "closed" });

    // Cập nhật delivery thành completed
    await Delivery.findOneAndUpdate(
      { orderId: order._id },
      { deliveryStatus: "completed" }
    );

    // Thông báo cho seller
    const io = req.app.get("io");
    await createNotification({
      recipientId: order.sellerId._id,
      type: "system",
      title: "Đơn hàng hoàn tất 🎉",
      content: `Đơn hàng "${order.postId.title}" đã hoàn tất.`,
      link: "/don-hang",
    }, io);

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id)
      .populate("buyerId", "fullName _id")
      .populate("sellerId", "fullName _id")
      .populate("postId", "title");
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    const io = req.app.get("io");
    order.orderStatus = orderStatus;

    if (orderStatus === "cancelled") {
      order.cancelReason = req.body.reason || "";
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCheckoutPreview,
  createOrder,
  getMyOrders,
  getMySales,
  getOrder,
  sellerConfirmOrder,
  sellerRejectOrder,
  cancelOrder,
  buyerConfirmDelivery,
  updateOrderStatus,
};
