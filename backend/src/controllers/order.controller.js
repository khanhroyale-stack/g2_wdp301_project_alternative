const Order = require("../models/order.model");
const ProductPost = require("../models/product_post.model");
const Delivery = require("../models/delivery.model");
const User = require("../models/user.model");
const ProductImage = require("../models/product_image.model");

const SHIPPING_FEE = 35000; // 35,000 VND

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const { productId, buyerAddress, buyerPhone, recipientName, note } = req.body;

    if (!productId || !buyerAddress || !buyerPhone || !recipientName) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng điền đầy đủ thông tin" 
      });
    }

    // Get product
    const product = await ProductPost.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    if (product.postStatus !== "approved") {
      return res.status(400).json({ 
        success: false, 
        message: "Sản phẩm chưa được duyệt" 
      });
    }

    if (!["sale", "both"].includes(product.productType)) {
      return res.status(400).json({ 
        success: false, 
        message: "Sản phẩm này không hỗ trợ mua" 
      });
    }

    // Check if buyer is not seller
    if (String(product.ownerId) === String(req.user._id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Bạn không thể mua sản phẩm của chính mình" 
      });
    }

    const totalAmount = product.salePrice + SHIPPING_FEE;

    const order = await Order.create({
      buyerId: req.user._id,
      sellerId: product.ownerId,
      postId: productId,
      productPrice: product.salePrice,
      shippingFee: SHIPPING_FEE,
      totalAmount,
      buyerAddress: buyerAddress.trim(),
      buyerPhone: buyerPhone.trim(),
      recipientName: recipientName.trim(),
      note: note || "",
      orderStatus: "pending"
    });

    // Populate and return
    const populatedOrder = await Order.findById(order._id)
      .populate("buyerId", "fullName email phone")
      .populate("sellerId", "fullName email phone address")
      .populate("postId", "title salePrice")
      .lean();

    res.status(201).json({ 
      success: true, 
      message: "Tạo đơn hàng thành công",
      data: populatedOrder 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get orders for buyer (my orders)
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .populate("sellerId", "fullName email phone")
      .populate("postId", "title salePrice")
      .sort({ createdAt: -1 })
      .lean();

    // Get images and delivery info for each order
    for (let order of orders) {
      if (order.postId) {
        const images = await ProductImage.findOne({ productPostId: order.postId._id })
          .select("imageUrl")
          .lean();
        order.productImage = images?.imageUrl || null;
      }
      
      const delivery = await Delivery.findOne({ orderId: order._id })
        .select("deliveryStatus shipperId")
        .populate("shipperId", "fullName phone")
        .lean();
      order.delivery = delivery;
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get orders for seller (my sales)
 * @route   GET /api/orders/my-sales
 * @access  Private
 */
const getMySales = async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.user._id })
      .populate("buyerId", "fullName email phone")
      .populate("postId", "title salePrice")
      .sort({ createdAt: -1 })
      .lean();

    // Get images and delivery info
    for (let order of orders) {
      if (order.postId) {
        const images = await ProductImage.findOne({ productPostId: order.postId._id })
          .select("imageUrl")
          .lean();
        order.productImage = images?.imageUrl || null;
      }
      
      const delivery = await Delivery.findOne({ orderId: order._id })
        .select("deliveryStatus shipperId")
        .populate("shipperId", "fullName phone")
        .lean();
      order.delivery = delivery;
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("buyerId", "fullName email phone address")
      .populate("sellerId", "fullName email phone address")
      .populate("postId")
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    // Check permission
    const isBuyer = String(order.buyerId._id) === String(req.user._id);
    const isSeller = String(order.sellerId._id) === String(req.user._id);
    
    if (!isBuyer && !isSeller && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Bạn không có quyền xem đơn hàng này" 
      });
    }

    // Get product images
    if (order.postId) {
      const images = await ProductImage.find({ productPostId: order.postId._id })
        .select("imageUrl displayOrder")
        .sort({ displayOrder: 1 })
        .lean();
      order.postId.images = images.map(img => img.imageUrl);
    }

    // Get delivery info
    const delivery = await Delivery.findOne({ orderId: order._id })
      .populate("shipperId", "fullName phone")
      .lean();
    order.delivery = delivery;

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update order status (seller confirms/cancels, buyer confirms received)
 * @route   PATCH /api/orders/:id/status
 * @access  Private
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    const isBuyer = String(order.buyerId) === String(req.user._id);
    const isSeller = String(order.sellerId) === String(req.user._id);

    // Seller confirms order
    if (status === "confirmed" && isSeller && order.orderStatus === "pending") {
      order.orderStatus = "confirmed";
      
      // Create delivery when seller confirms
      const seller = await User.findById(order.sellerId);
      await Delivery.create({
        orderId: order._id,
        shipperId: null, // Will be assigned when shipper accepts
        pickupAddress: seller.address || "Địa chỉ người bán chưa cập nhật",
        deliveryAddress: order.buyerAddress,
        deliveryFee: order.shippingFee,
        deliveryType: "standard",
        deliveryStatus: "pending"
      });
    }
    // Cancel order
    else if (status === "cancelled" && (isBuyer || isSeller) && order.orderStatus === "pending") {
      order.orderStatus = "cancelled";
    }
    // Buyer confirms delivered
    else if (status === "delivered" && isBuyer && order.orderStatus === "shipping") {
      order.orderStatus = "delivered";
      
      // Update delivery status
      await Delivery.findOneAndUpdate(
        { orderId: order._id },
        { deliveryStatus: "delivered" }
      );
    }
    else {
      return res.status(400).json({ 
        success: false, 
        message: "Không thể cập nhật trạng thái đơn hàng" 
      });
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("buyerId", "fullName email phone")
      .populate("sellerId", "fullName email phone")
      .populate("postId", "title salePrice")
      .lean();

    res.json({ 
      success: true, 
      message: "Cập nhật trạng thái thành công",
      data: updatedOrder 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get checkout preview before creating order
 * @route   GET /api/orders/checkout/:productId
 * @access  Private
 */
const getCheckoutPreview = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.params.productId)
      .populate("ownerId", "fullName email phone address reputationScore")
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    if (!["sale", "both"].includes(product.productType)) {
      return res.status(400).json({ 
        success: false, 
        message: "Sản phẩm này không hỗ trợ mua" 
      });
    }

    // Get images
    const images = await ProductImage.find({ productPostId: product._id })
      .select("imageUrl displayOrder")
      .sort({ displayOrder: 1 })
      .lean();
    product.images = images.map(img => img.imageUrl);

    const subtotal = product.salePrice;
    const totalAmount = subtotal + SHIPPING_FEE;

    res.json({
      success: true,
      data: {
        product,
        shippingFee: SHIPPING_FEE,
        subtotal,
        totalAmount,
        buyer: {
          fullName: req.user.fullName,
          phone: req.user.phone || "",
          address: req.user.address || ""
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getMySales,
  getOrderById,
  updateOrderStatus,
  getCheckoutPreview
};
