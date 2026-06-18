const Order = require("../models/order.model");
const ProductPost = require("../models/product_post.model");
const Delivery = require("../models/delivery.model");
const User = require("../models/user.model");
const ProductImage = require("../models/product_image.model");

const SHIPPING_FEE = 35000;
const ACTIVE_ORDER_STATUSES = ["pending", "confirmed", "shipping", "delivered"];

const getProductAvailabilityError = (product, viewerId, seller) => {
  if (!product) {
    return { code: 404, message: "Sản phẩm không tồn tại" };
  }

  if (product.postStatus !== "approved") {
    return { code: 400, message: "Sản phẩm hiện không khả dụng để đặt mua" };
  }

  if (!["sale", "both"].includes(product.productType)) {
    return { code: 400, message: "Sản phẩm này không hỗ trợ mua" };
  }

  if (String(product.ownerId?._id || product.ownerId) === String(viewerId)) {
    return { code: 400, message: "Bạn không thể mua sản phẩm của chính mình" };
  }

  if (!seller || seller.accountStatus !== "active") {
    return { code: 400, message: "Người bán hiện không thể nhận đơn hàng" };
  }

  return null;
};

const getOrderActionFlags = (order, delivery, userId) => {
  const currentUserId = String(userId);
  const isBuyer = String(order.buyerId?._id || order.buyerId) === currentUserId;
  const isSeller = String(order.sellerId?._id || order.sellerId) === currentUserId;

  return {
    isBuyer,
    isSeller,
    canBuyerCancel:
      isBuyer &&
      ["pending", "confirmed"].includes(order.orderStatus) &&
      (!delivery || !delivery.shipperId),
    canSellerConfirm: isSeller && order.orderStatus === "pending",
    canSellerReject:
      isSeller &&
      ["pending", "confirmed"].includes(order.orderStatus) &&
      (!delivery || !delivery.shipperId),
    canBuyerComplete:
      isBuyer &&
      order.orderStatus === "delivered" &&
      delivery?.deliveryStatus === "delivered",
  };
};

const hydrateOrderListItem = async (order, viewerId) => {
  if (order.postId?._id) {
    const image = await ProductImage.findOne({ productPostId: order.postId._id })
      .select("imageUrl")
      .lean();
    order.productImage = image?.imageUrl || null;
  }

  const delivery = await Delivery.findOne({ orderId: order._id })
    .select("deliveryStatus shipperId createdAt updatedAt history failureReason")
    .populate("shipperId", "fullName phone")
    .lean();
  order.delivery = delivery;
  order.actions = getOrderActionFlags(order, delivery, viewerId);

  return order;
};

const createOrder = async (req, res) => {
  try {
    const { productId, buyerAddress, buyerPhone, recipientName, note } = req.body;

    if (!productId || !buyerAddress || !buyerPhone || !recipientName) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    const product = await ProductPost.findById(productId);
    const seller = product ? await User.findById(product.ownerId).select("accountStatus") : null;
    const availabilityError = getProductAvailabilityError(product, req.user._id, seller);
    if (availabilityError) {
      return res.status(availabilityError.code).json({ success: false, message: availabilityError.message });
    }

    const existingOrder = await Order.findOne({
      postId: productId,
      orderStatus: { $in: ACTIVE_ORDER_STATUSES },
    }).lean();
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm này đang có đơn hàng đang xử lý",
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
      orderStatus: "pending",
    });

    const populatedOrder = await Order.findById(order._id)
      .populate("buyerId", "fullName email phone")
      .populate("sellerId", "fullName email phone address")
      .populate("postId", "title salePrice")
      .lean();
    populatedOrder.actions = getOrderActionFlags(populatedOrder, null, req.user._id);

    res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công",
      data: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user._id })
      .populate("sellerId", "fullName email phone")
      .populate("postId", "title salePrice")
      .sort({ createdAt: -1 })
      .lean();

    for (const order of orders) {
      await hydrateOrderListItem(order, req.user._id);
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMySales = async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.user._id })
      .populate("buyerId", "fullName email phone")
      .populate("postId", "title salePrice")
      .sort({ createdAt: -1 })
      .lean();

    for (const order of orders) {
      await hydrateOrderListItem(order, req.user._id);
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

    const isBuyer = String(order.buyerId._id) === String(req.user._id);
    const isSeller = String(order.sellerId._id) === String(req.user._id);
    if (!isBuyer && !isSeller && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem đơn hàng này",
      });
    }

    if (order.postId?._id) {
      const images = await ProductImage.find({ productPostId: order.postId._id })
        .select("imageUrl displayOrder")
        .sort({ displayOrder: 1 })
        .lean();
      order.postId.images = images.map((img) => img.imageUrl);
    }

    const delivery = await Delivery.findOne({ orderId: order._id })
      .populate("shipperId", "fullName phone")
      .lean();
    order.delivery = delivery;
    order.actions = getOrderActionFlags(order, delivery, req.user._id);

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    const isBuyer = String(order.buyerId) === String(req.user._id);
    const isSeller = String(order.sellerId) === String(req.user._id);

    if (status === "confirmed" && isSeller && order.orderStatus === "pending") {
      order.orderStatus = "confirmed";
      order.cancelReason = "";

      const seller = await User.findById(order.sellerId).select("address accountStatus");
      if (!seller || seller.accountStatus !== "active") {
        return res.status(400).json({ success: false, message: "Seller hiện không thể xác nhận đơn" });
      }

      const existingDelivery = await Delivery.findOne({ orderId: order._id });
      if (!existingDelivery) {
        await Delivery.create({
          orderId: order._id,
          shipperId: null,
          pickupAddress: seller.address || "Địa chỉ người bán chưa cập nhật",
          deliveryAddress: order.buyerAddress,
          deliveryFee: order.shippingFee,
          deliveryType: "standard",
          deliveryStatus: "pending",
          history: [
            {
              status: "pending",
              note: "Đơn giao hàng được tạo sau khi seller xác nhận đơn.",
              timestamp: new Date(),
            },
          ],
        });
      }
    } else if (
      status === "cancelled" &&
      (isBuyer || isSeller) &&
      ["pending", "confirmed"].includes(order.orderStatus)
    ) {
      const delivery = await Delivery.findOne({ orderId: order._id });
      if (delivery?.shipperId || ["in_transit", "delivered"].includes(delivery?.deliveryStatus)) {
        return res.status(400).json({
          success: false,
          message: "Không thể hủy đơn khi delivery đã có shipper hoặc đang giao",
        });
      }

      order.orderStatus = "cancelled";
      order.cancelReason = (cancelReason || "").trim();

      if (delivery) {
        delivery.deliveryStatus = "failed";
        delivery.failureReason = order.cancelReason || `Đơn hàng bị hủy bởi ${isBuyer ? "buyer" : "seller"}.`;
        delivery.history.push({
          status: "failed",
          note: delivery.failureReason,
          timestamp: new Date(),
        });
        await delivery.save();
      }
    } else if (status === "completed" && isBuyer && order.orderStatus === "delivered") {
      const delivery = await Delivery.findOne({ orderId: order._id });
      if (!delivery || delivery.deliveryStatus !== "delivered") {
        return res.status(400).json({
          success: false,
          message: "Đơn hàng chưa ở trạng thái đã giao để xác nhận hoàn tất",
        });
      }

      order.orderStatus = "completed";
      order.cancelReason = "";
      delivery.deliveryStatus = "completed";
      delivery.history.push({
        status: "completed",
        note: "Buyer da xac nhan da nhan hang va hoan tat giao dich.",
        timestamp: new Date(),
      });
      await delivery.save();
      await ProductPost.findByIdAndUpdate(order.postId, { postStatus: "closed" });
    } else {
      return res.status(400).json({
        success: false,
        message: "Không thể cập nhật trạng thái đơn hàng",
      });
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("buyerId", "fullName email phone address")
      .populate("sellerId", "fullName email phone address")
      .populate("postId", "title salePrice")
      .lean();
    const delivery = await Delivery.findOne({ orderId: order._id })
      .populate("shipperId", "fullName phone")
      .lean();
    updatedOrder.delivery = delivery;
    updatedOrder.actions = getOrderActionFlags(updatedOrder, delivery, req.user._id);

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCheckoutPreview = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.params.productId)
      .populate("ownerId", "fullName email phone address reputationScore accountStatus")
      .lean();

    const availabilityError = getProductAvailabilityError(product, req.user._id, product?.ownerId);
    if (availabilityError) {
      return res.status(availabilityError.code).json({ success: false, message: availabilityError.message });
    }

    const images = await ProductImage.find({ productPostId: product._id })
      .select("imageUrl displayOrder")
      .sort({ displayOrder: 1 })
      .lean();
    product.images = images.map((img) => img.imageUrl);

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
          address: req.user.address || "",
        },
      },
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
  getCheckoutPreview,
};
