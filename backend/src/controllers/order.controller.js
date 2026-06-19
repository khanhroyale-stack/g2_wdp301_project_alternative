const Order = require("../models/order.model");
const ProductPost = require("../models/product_post.model");
const ProductImage = require("../models/product_image.model");
const { createNotification } = require("./notification.controller");

const getCheckoutPreview = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.params.productId).populate("ownerId", "fullName phone avatar");
    if (!product || product.postStatus !== "approved") {
      return res.status(400).json({ success: false, message: "Sản phẩm không còn khả dụng" });
    }

    const images = await ProductImage.find({ postId: product._id }).populate("field", "publicUrl").sort({ isThumbnail: -1, sortOrder: 1 });
    const imageUrls = images.map((img) => img.field?.publicUrl).filter(Boolean);

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
    const product = await ProductPost.findById(req.body.productId).populate("ownerId", "fullName");
    if (!product || product.postStatus !== "approved")
      return res.status(400).json({ success: false, message: "Sản phẩm không còn khả dụng" });

    if (product.ownerId._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, message: "Không thể mua sản phẩm của chính mình" });

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
      buyerAddress: req.body.buyerAddress || "",
      buyerPhone: req.body.buyerPhone || "",
      recipientName: req.body.recipientName || req.user.fullName,
      note: req.body.note || "",
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
      .populate("sellerId", "fullName avatar phone")
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
      .populate("buyerId", "fullName avatar phone")
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
      .populate("buyerId", "fullName avatar phone")
      .populate("sellerId", "fullName avatar phone");
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
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
    if (orderStatus === "confirmed") {
      await createNotification({
        recipientId: order.buyerId._id,
        type: "system",
        title: "Người bán đã xác nhận đơn hàng ✅",
        content: `Đơn hàng "${order.postId?.title}" đã được người bán xác nhận.`,
        link: "/don-hang",
      }, io);
    }
    if (orderStatus === "completed") {
      await ProductPost.findByIdAndUpdate(order.postId._id || order.postId, { postStatus: "closed" });
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCheckoutPreview, createOrder, getMyOrders, getMySales, getOrder, updateOrderStatus,
};
