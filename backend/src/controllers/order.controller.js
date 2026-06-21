const Order = require("../models/order.model");
const ProductPost = require("../models/product_post.model");
const Delivery = require("../models/delivery.model");
const User = require("../models/user.model");
const { createNotification } = require("./notification.controller");
const {
  getProductImageUrls,
  getProductThumbnailUrl,
} = require("../utils/product-images.util");

const SHIPPING_FEE = 35000;

const sendOrderNotification = async (payload, io) => {
  await createNotification(
    {
      ...payload,
      type: "order_update",
      relatedType: "order",
      link: payload.link || `/orders/${payload.relatedId}`,
    },
    io
  );
};

const syncProductPostStatus = async (productId, nextStatus) => {
  if (!productId || !nextStatus) {
    return;
  }

  await ProductPost.findByIdAndUpdate(productId, { postStatus: nextStatus });
};

const syncProductAvailability = async (productId) => {
  const product = await ProductPost.findById(productId).select("quantity postStatus");
  if (!product) {
    return null;
  }

  const nextStatus = product.quantity > 0 ? "approved" : "closed";
  if (product.postStatus !== nextStatus) {
    product.postStatus = nextStatus;
    await product.save();
  }

  return product;
};

const reserveProductQuantity = async (productId, requestedQuantity) => {
  const quantity = Math.max(Number(requestedQuantity) || 1, 1);
  const product = await ProductPost.findOneAndUpdate(
    {
      _id: productId,
      quantity: { $gte: quantity },
      postStatus: "approved",
    },
    { $inc: { quantity: -quantity } },
    { new: true }
  );

  if (!product) {
    return null;
  }

  await syncProductAvailability(productId);
  return product;
};

const releaseProductQuantity = async (productId, quantityToRelease) => {
  const quantity = Math.max(Number(quantityToRelease) || 0, 0);
  if (!quantity) {
    return null;
  }

  await ProductPost.findByIdAndUpdate(productId, { $inc: { quantity: quantity } });
  return syncProductAvailability(productId);
};

const getProductAvailabilityError = (product, viewerId, seller) => {
  if (!product) {
    return { code: 404, message: "San pham khong ton tai" };
  }

  if (product.postStatus !== "approved") {
    return { code: 400, message: "San pham hien khong kha dung de dat mua" };
  }

  if (!["sale", "both"].includes(product.productType)) {
    return { code: 400, message: "San pham nay khong ho tro mua" };
  }

  if ((Number(product.quantity) || 0) < 1) {
    return { code: 400, message: "San pham da het hang" };
  }

  if (String(product.ownerId?._id || product.ownerId) === String(viewerId)) {
    return { code: 400, message: "Ban khong the mua san pham cua chinh minh" };
  }

  if (!seller || seller.accountStatus !== "active") {
    return { code: 400, message: "Nguoi ban hien khong the nhan don hang" };
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
      order.orderStatus === "pending" &&
      (!delivery || !delivery.shipperId),
    canBuyerComplete:
      isBuyer &&
      order.orderStatus === "delivered" &&
      delivery?.deliveryStatus === "delivered",
  };
};

const hydrateOrderListItem = async (order, viewerId) => {
  if (order.postId?._id) {
    order.productImage = await getProductThumbnailUrl(order.postId._id);
  }

  const delivery = await Delivery.findOne({ orderId: order._id })
    .select("deliveryStatus shipperId createdAt updatedAt history failureReason")
    .populate("shipperId", "fullName phone")
    .lean();
  order.delivery = delivery;
  order.actions = getOrderActionFlags(order, delivery, viewerId);

  return order;
};

const buildOrderResponse = async (orderId, viewerId) => {
  const updatedOrder = await Order.findById(orderId)
    .populate("buyerId", "fullName email phone address")
    .populate("sellerId", "fullName email phone address")
    .populate("postId", "title salePrice")
    .lean();
  const delivery = await Delivery.findOne({ orderId })
    .populate("shipperId", "fullName phone")
    .lean();
  updatedOrder.delivery = delivery;
  updatedOrder.actions = getOrderActionFlags(updatedOrder, delivery, viewerId);
  return updatedOrder;
};

const createOrder = async (req, res) => {
  try {
    const { productId, buyerAddress, buyerPhone, recipientName, note, quantity: rawQuantity } = req.body;
    const io = req.app.get("io");
    const quantity = Math.max(Number(rawQuantity) || 1, 1);

    if (!productId || !buyerAddress || !buyerPhone || !recipientName) {
      return res.status(400).json({
        success: false,
        message: "Vui long dien day du thong tin",
      });
    }

    const product = await ProductPost.findById(productId);
    const seller = product ? await User.findById(product.ownerId).select("accountStatus") : null;
    const availabilityError = getProductAvailabilityError(product, req.user._id, seller);
    if (availabilityError) {
      return res.status(availabilityError.code).json({ success: false, message: availabilityError.message });
    }

    if ((Number(product.quantity) || 0) < quantity) {
      return res.status(400).json({
        success: false,
        message: `So luong san pham con lai khong du. Hien chi con ${product.quantity}.`,
      });
    }

    const reservedProduct = await reserveProductQuantity(productId, quantity);
    if (!reservedProduct) {
      return res.status(400).json({
        success: false,
        message: "So luong san pham hien khong con du de dat mua",
      });
    }

    const totalAmount = product.salePrice * quantity + SHIPPING_FEE;
    const order = await Order.create({
      buyerId: req.user._id,
      sellerId: product.ownerId,
      postId: productId,
      quantity,
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

    await sendOrderNotification(
      {
        recipientId: populatedOrder.sellerId?._id || product.ownerId,
        title: "Bạn có đơn hàng mới",
        content: `${populatedOrder.buyerId?.fullName || "Người mua"} vừa đặt mua ${quantity} "${populatedOrder.postId?.title || "sản phẩm"}".`,
        relatedId: order._id,
      },
      io
    );

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
      return res.status(404).json({ success: false, message: "Khong tim thay don hang" });
    }

    const isBuyer = String(order.buyerId._id) === String(req.user._id);
    const isSeller = String(order.sellerId._id) === String(req.user._id);
    if (!isBuyer && !isSeller && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen xem don hang nay",
      });
    }

    if (order.postId?._id) {
      order.postId.images = await getProductImageUrls(order.postId._id);
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
    const io = req.app.get("io");

    if (!order) {
      return res.status(404).json({ success: false, message: "Khong tim thay don hang" });
    }

    const isBuyer = String(order.buyerId) === String(req.user._id);
    const isSeller = String(order.sellerId) === String(req.user._id);
    const delivery = await Delivery.findOne({ orderId: order._id });

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen cap nhat don hang nay",
      });
    }

    if (status === order.orderStatus) {
      const currentOrder = await buildOrderResponse(order._id, req.user._id);
      return res.json({
        success: true,
        message: "Trang thai don hang da duoc cap nhat truoc do",
        data: currentOrder,
      });
    }

    if (status === "confirmed" && isSeller && order.orderStatus === "pending") {
      order.orderStatus = "confirmed";
      order.cancelReason = "";

      const seller = await User.findById(order.sellerId).select("address accountStatus");
      if (!seller || seller.accountStatus !== "active") {
        return res.status(400).json({ success: false, message: "Seller hien khong the xac nhan don" });
      }

      if (!delivery) {
        await Delivery.create({
          orderId: order._id,
          shipperId: null,
          pickupAddress: seller.address || "Dia chi nguoi ban chua cap nhat",
          deliveryAddress: order.buyerAddress,
          deliveryFee: order.shippingFee,
          deliveryType: "standard",
          deliveryStatus: "pending",
          history: [
            {
              status: "pending",
              note: "Don giao hang duoc tao sau khi seller xac nhan don.",
              timestamp: new Date(),
            },
          ],
        });
      }

      await sendOrderNotification(
        {
          recipientId: order.buyerId,
          title: "Đơn hàng đã được xác nhận",
          content: "Người bán đã xác nhận đơn hàng của bạn và hệ thống đang chờ shipper nhận đơn.",
          relatedId: order._id,
        },
        io
      );
    } else if (
      status === "cancelled" &&
      ((isBuyer && ["pending", "confirmed"].includes(order.orderStatus)) ||
        (isSeller && order.orderStatus === "pending"))
    ) {
      if (delivery?.shipperId || ["in_transit", "delivered"].includes(delivery?.deliveryStatus)) {
        return res.status(400).json({
          success: false,
          message: "Khong the huy don khi delivery da co shipper hoac dang giao",
        });
      }

      order.orderStatus = "cancelled";
      order.cancelReason = (cancelReason || "").trim();

      if (delivery) {
        delivery.deliveryStatus = "failed";
        delivery.failureReason = order.cancelReason || `Đơn hàng bị hủy bởi ${isBuyer ? "người mua" : "người bán"}.`;
        delivery.history.push({
          status: "failed",
          note: delivery.failureReason,
          timestamp: new Date(),
        });
        await delivery.save();
      }

      await releaseProductQuantity(order.postId, order.quantity);

      if (isSeller) {
        await sendOrderNotification(
          {
            recipientId: order.buyerId,
            title: "Đơn hàng đã bị từ chối",
            content: order.cancelReason
              ? `Người bán đã từ chối đơn hàng. Lý do: ${order.cancelReason}`
              : "Người bán đã từ chối đơn hàng của bạn.",
            relatedId: order._id,
          },
          io
        );
      }

      if (isBuyer) {
        await sendOrderNotification(
          {
            recipientId: order.sellerId,
            title: "Người mua đã hủy đơn hàng",
            content: order.cancelReason
              ? `Người mua đã hủy đơn hàng. Lý do: ${order.cancelReason}`
              : "Người mua đã hủy đơn hàng này.",
            relatedId: order._id,
          },
          io
        );
      }
    } else if (status === "completed" && isBuyer && order.orderStatus === "delivered") {
      if (!delivery || delivery.deliveryStatus !== "delivered") {
        return res.status(400).json({
          success: false,
          message: "Don hang chua o trang thai da giao de xac nhan hoan tat",
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
      await syncProductAvailability(order.postId);

      await sendOrderNotification(
        {
          recipientId: order.sellerId,
          title: "Đơn hàng đã hoàn tất",
          content: "Người mua đã xác nhận nhận hàng. Giao dịch đã hoàn tất.",
          relatedId: order._id,
        },
        io
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Khong the cap nhat trang thai don hang",
      });
    }

    await order.save();
    const updatedOrder = await buildOrderResponse(order._id, req.user._id);

    res.json({
      success: true,
      message: "Cap nhat trang thai thanh cong",
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

    product.images = await getProductImageUrls(product._id);

    const quantity = Math.max(Number(req.query.quantity) || 1, 1);
    if ((Number(product.quantity) || 0) < quantity) {
      return res.status(400).json({
        success: false,
        message: `So luong san pham con lai khong du. Hien chi con ${product.quantity}.`,
      });
    }

    const subtotal = product.salePrice * quantity;
    const totalAmount = subtotal + SHIPPING_FEE;

    res.json({
      success: true,
      data: {
        product,
        quantity,
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
