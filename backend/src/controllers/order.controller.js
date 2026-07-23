const Delivery = require("../models/delivery.model");
const DeliveryInspection = require("../models/delivery_inspection.model");
const Order = require("../models/order.model");
const ProductPost = require("../models/product_post.model");
const User = require("../models/user.model");
const { formatUser, hydrateProducts } = require("../utils/serializers");
const {
  commitOrderInventory,
  releaseOrderInventory,
  releaseProductQuantity,
  reserveProductQuantity,
} = require("../services/order-inventory.service");
const { buildPaymentUrl, verifyReturn } = require("../utils/vnpay.util");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SHIPPING_FEE = 35000;

// Return URL riêng cho đơn hàng: cùng host với VNP_RETURNURL nhưng path của orders,
// để không đụng handler của gói Pro và không cần thêm biến .env.
const buildOrderReturnUrl = () => {
  try {
    const base = new URL(process.env.VNP_RETURNURL);
    base.pathname = "/api/orders/vnpay-return";
    base.search = "";
    return base.toString();
  } catch {
    return `${process.env.SERVER_URL || "http://localhost:5000"}/api/orders/vnpay-return`;
  }
};
const ACTIVE_DELIVERY_STATES = ["WAITING_SHIPPER", "SHIPPER_ACCEPTED", "PICKING_UP", "PICKED_UP", "DELIVERING", "DELIVERED"];
const AVAILABLE_PRODUCT_STATUSES = ["approved", "available"];

const ORDER_STATUS_TO_UI = {
  PENDING: "pending",
  SELLER_CONFIRMED: "confirmed",
  PICKING_UP: "shipping",
  PICKED_UP: "shipping",
  DELIVERING: "shipping",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const ORDER_STATUS_FROM_UI = {
  pending: "PENDING",
  confirmed: "SELLER_CONFIRMED",
  shipping: "DELIVERING",
  delivered: "DELIVERED",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
};

const DELIVERY_STATUS_TO_UI = {
  WAITING_SHIPPER: "pending",
  SHIPPER_ACCEPTED: "accepted",
  PICKING_UP: "picking_up",
  PICKED_UP: "picked_up",
  DELIVERING: "in_transit",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  FAILED: "failed",
};

const getUiOrderStatus = (status) => ORDER_STATUS_TO_UI[status] || status || "pending";
const getUiDeliveryStatus = (status) => DELIVERY_STATUS_TO_UI[status] || status || "pending";
const getEntityId = (value) => value?._id || value?.id || value;

const buildOrderActions = (order, viewerId) => {
  const isBuyer = String(getEntityId(order.buyerId)) === String(viewerId);
  const isSeller = String(getEntityId(order.sellerId)) === String(viewerId);
  const uiStatus = getUiOrderStatus(order.status);

  return {
    isBuyer,
    isSeller,
    canBuyerCancel: isBuyer && uiStatus === "pending",
    canBuyerComplete: isBuyer && uiStatus === "delivered",
    canSellerConfirm: isSeller && uiStatus === "pending",
    canSellerReject: isSeller && uiStatus === "pending",
  };
};

const loadOrdersWithRelations = async (filter) => {
  const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
  const postIds = [...new Set(orders.map((order) => String(order.postId)))];

  const [products, deliveries] = await Promise.all([
    ProductPost.find({ _id: { $in: postIds } }).lean(),
    Delivery.find({ orderId: { $in: orders.map((order) => order._id) } }).lean(),
  ]);

  const userIds = [
    ...new Set(
      orders
        .flatMap((order) => [order.buyerId, order.sellerId])
        .concat(deliveries.map((delivery) => delivery.shipperId))
        .filter(Boolean)
        .map(String)
    ),
  ];
  const users = await User.find({ _id: { $in: userIds } }).lean();

  const productMap = new Map((await hydrateProducts(products)).map((item) => [String(item._id), item]));
  const userMap = new Map(users.map((user) => [String(user._id), user]));
  const deliveryMap = new Map(deliveries.map((delivery) => [String(delivery.orderId), delivery]));

  return orders.map((order) => {
    const delivery = deliveryMap.get(String(order._id));
    const shipper = delivery?.shipperId ? userMap.get(String(delivery.shipperId)) : null;
    const product = productMap.get(String(order.postId)) || null;
    const buyer = formatUser(userMap.get(String(order.buyerId)));
    const seller = formatUser(userMap.get(String(order.sellerId)));

    return {
      ...order,
      status: order.status,
      orderStatus: getUiOrderStatus(order.status),
      postId: product,
      product,
      productImage: product?.images?.[0] || product?.thumbnailUrl || null,
      buyerId: buyer || order.buyerId,
      sellerId: seller || order.sellerId,
      buyer,
      seller,
      shipper: formatUser(shipper),
      actions: buildOrderActions(order, filter.buyerId || filter.sellerId || null),
      delivery: delivery
        ? {
            _id: delivery._id,
            status: delivery.status,
            deliveryStatus: getUiDeliveryStatus(delivery.status),
            shipperId: shipper ? { _id: delivery.shipperId, ...formatUser(shipper) } : null,
            pickupAddress: delivery.pickupAddress,
            deliveryAddress: delivery.deliveryAddress,
            deliveryFee: delivery.deliveryFee,
            deliveryType: delivery.deliveryType,
            history: delivery.history || [],
          }
        : null,
    };
  });
};

const ensureProductCanBeOrdered = (product, buyerId, quantity = 1) => {
  if (!product) {
    return "Sản phẩm không tồn tại";
  }

  if (!["sale", "both"].includes(product.productType) || !product.salePrice) {
    return "Sản phẩm này không hỗ trợ mua trực tiếp";
  }

  if (!AVAILABLE_PRODUCT_STATUSES.includes(product.postStatus)) {
    return "Sản phẩm hiện không sẵn sàng để mua";
  }

  if ((Number(product.quantity) || 0) < quantity) {
    return `Số lượng vượt quá tồn kho hiện có. Chỉ còn ${product.quantity || 0} sản phẩm.`;
  }

  if (String(product.ownerId) === String(buyerId)) {
    return "Bạn không thể tự mua sản phẩm của chính mình";
  }

  return null;
};

const getCheckoutPreview = async (req, res) => {
  try {
    const quantity = Math.max(Number(req.query.quantity) || 1, 1);
    const product = await ProductPost.findById(req.params.productId).lean();
    const invalidReason = ensureProductCanBeOrdered(product, req.user._id, quantity);

    if (invalidReason) {
      return res.status(400).json({ success: false, message: invalidReason });
    }

    const seller = await User.findById(product.ownerId).lean();
    const [formattedProduct] = await hydrateProducts([product]);
    const subtotal = (product.salePrice || 0) * quantity;
    const totalAmount = subtotal + SHIPPING_FEE;

    res.json({
      success: true,
      data: {
        product: {
          ...formattedProduct,
          seller: formatUser(seller),
        },
        quantity,
        shippingFee: SHIPPING_FEE,
        subtotal,
        discountAmount: 0,
        totalAmount,
        customer: {
          recipientName: req.user.fullName || "",
          phone: req.user.phone || "",
          address: req.user.address || "",
        },
        paymentMethod: "COD",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const { productId, recipientName, buyerPhone, buyerAddress, note, shippingFee } = req.body;
    const quantity = Math.max(Number(req.body.quantity) || 1, 1);
    const paymentMethod = req.body.paymentMethod === "VNPAY" ? "VNPAY" : "COD";

    if (!productId || !recipientName || !buyerPhone || !buyerAddress) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin đặt hàng" });
    }

    const product = await ProductPost.findById(productId).lean();
    const invalidReason = ensureProductCanBeOrdered(product, req.user._id, quantity);

    if (invalidReason) {
      return res.status(400).json({ success: false, message: invalidReason });
    }

    const reservedProduct = await reserveProductQuantity(product._id, quantity);
    if (!reservedProduct) {
      return res.status(400).json({ success: false, message: "Sản phẩm hiện không đủ số lượng để mua" });
    }

    const normalizedShippingFee = Number.isFinite(Number(shippingFee)) ? Number(shippingFee) : SHIPPING_FEE;
    let order;
    try {
      order = await Order.create({
        buyerId: req.user._id,
        sellerId: product.ownerId,
        postId: product._id,
        quantity,
        productPrice: product.salePrice,
        shippingFee: normalizedShippingFee,
        totalAmount: product.salePrice * quantity + normalizedShippingFee,
        recipientName: recipientName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerAddress: buyerAddress.trim(),
        note: (note || "").trim(),
        paymentMethod,
        paymentStatus: "unpaid",
        status: "PENDING",
        inventoryStatus: "reserved",
      });
    } catch (error) {
      await releaseProductQuantity(product._id, quantity);
      throw error;
    }

    // Thanh toán chuyển khoản qua VNPay: sinh mã giao dịch, trả về URL để redirect
    if (paymentMethod === "VNPAY") {
      try {
        const txnRef = `ORDER-${order._id}-${Date.now()}`;
        order.vnpTxnRef = txnRef;
        await order.save();

        const paymentUrl = buildPaymentUrl({
          amount: order.totalAmount,
          txnRef,
          orderInfo: `Thanh toan don hang ${order._id}`,
          ipAddr: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1",
          returnUrl: buildOrderReturnUrl(),
        });

        return res.status(201).json({
          success: true,
          message: "Đã tạo đơn hàng, chuyển tới cổng thanh toán VNPay",
          paymentMethod: "VNPAY",
          paymentUrl,
          data: await loadOrdersWithRelations({ _id: order._id }).then((r) => r[0]),
        });
      } catch (vnpErr) {
        // Không tạo được link thanh toán → hủy đơn, hoàn kho để tránh giữ hàng ảo
        await releaseOrderInventory(order._id);
        await Order.findByIdAndUpdate(order._id, { status: "CANCELLED" });
        return res.status(500).json({ success: false, message: `Không thể khởi tạo thanh toán VNPay: ${vnpErr.message}` });
      }
    }

    const [data] = await loadOrdersWithRelations({ _id: order._id });

    res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công",
      paymentMethod: "COD",
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/vnpay-return — VNPay redirect về sau thanh toán đơn hàng (route public)
const vnpayReturn = async (req, res) => {
  const resultUrl = (orderId, status) => `${CLIENT_URL}/orders/${orderId}?payment=${status}`;
  const failUrl = (status = "failed") => `${CLIENT_URL}/orders/my-orders?payment=${status}`;
  try {
    const { isValid, data } = verifyReturn(req.query);
    const order = await Order.findOne({ vnpTxnRef: data.vnp_TxnRef });
    if (!order) {
      return res.redirect(failUrl());
    }
    if (!isValid) {
      return res.redirect(resultUrl(order._id, "failed"));
    }
    // Idempotent: đã thanh toán trước đó (ví dụ người dùng refresh trang return)
    if (order.paymentStatus === "paid") {
      return res.redirect(resultUrl(order._id, "success"));
    }

    const paidOk =
      data.vnp_ResponseCode === "00" &&
      data.vnp_TransactionStatus === "00" &&
      Number(data.vnp_Amount) === order.totalAmount * 100;

    if (!paidOk) {
      // Thất bại / hủy giữa chừng → hủy đơn + hoàn kho
      await releaseOrderInventory(order._id);
      await Order.findByIdAndUpdate(order._id, { status: "CANCELLED" });
      return res.redirect(resultUrl(order._id, "failed"));
    }

    order.paymentStatus = "paid";
    order.vnpTransactionNo = data.vnp_TransactionNo || null;
    await order.save();
    await commitOrderInventory(order._id);

    return res.redirect(resultUrl(order._id, "success"));
  } catch (err) {
    return res.redirect(failUrl());
  }
};

const getMyOrders = async (req, res) => {
  try {
    const data = await loadOrdersWithRelations({ buyerId: req.user._id });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMySales = async (req, res) => {
  try {
    const data = await loadOrdersWithRelations({ sellerId: req.user._id });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const [order] = await loadOrdersWithRelations({ _id: req.params.id });

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    const canView =
      String(getEntityId(order.buyerId)) === String(req.user._id) ||
      String(getEntityId(order.sellerId)) === String(req.user._id) ||
      String(order.shipper?._id || "") === String(req.user._id) ||
      req.user.role === "admin";

    if (!canView) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem đơn hàng này" });
    }

    res.json({ success: true, data: { ...order, actions: buildOrderActions(order, req.user._id) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const ensureDeliveryForOrder = async (order, seller) => {
  let delivery = await Delivery.findOne({ orderId: order._id });

  if (!delivery) {
    delivery = await Delivery.create({
      orderId: order._id,
      pickupAddress: seller.address || "Chưa cập nhật địa chỉ người bán",
      deliveryAddress: order.buyerAddress,
      deliveryFee: order.shippingFee,
      deliveryType: "standard",
      status: "WAITING_SHIPPER",
      history: [{ status: "WAITING_SHIPPER", note: "Seller đã xác nhận đơn hàng" }],
    });
  }

  return delivery;
};

const updateOrderStatus = async (req, res) => {
  try {
    const requestedStatus = req.body.status;
    const status = ORDER_STATUS_FROM_UI[requestedStatus] || requestedStatus;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    const isBuyer = String(order.buyerId) === String(req.user._id);
    const isSeller = String(order.sellerId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isBuyer && !isSeller && !isAdmin && req.user.role !== "shipper") {
      return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật đơn hàng này" });
    }

    let delivery = await Delivery.findOne({ orderId: order._id });

    if (status === "CANCELLED") {
      if (!isBuyer && !isSeller && !isAdmin) {
        return res.status(403).json({ success: false, message: "Chỉ người mua hoặc người bán mới có thể hủy đơn" });
      }
      if (delivery && ACTIVE_DELIVERY_STATES.includes(delivery.status) && delivery.status !== "WAITING_SHIPPER") {
        return res.status(400).json({ success: false, message: "Không thể hủy vì đơn đã bắt đầu giao" });
      }
      order.status = "CANCELLED";
      await releaseOrderInventory(order._id);
      if (delivery) {
        delivery.status = "FAILED";
        delivery.failureReason = "Đơn hàng đã bị hủy";
        delivery.history.push({ status: "FAILED", note: "Đơn hàng bị hủy" });
        await delivery.save();
      }
    } else if (status === "SELLER_CONFIRMED") {
      if (!isSeller && !isAdmin) {
        return res.status(403).json({ success: false, message: "Chỉ người bán mới có thể xác nhận đơn" });
      }
      if (order.status !== "PENDING") {
        return res.status(400).json({ success: false, message: "Đơn hàng không còn ở trạng thái chờ xác nhận" });
      }
      order.status = "SELLER_CONFIRMED";
      await ensureDeliveryForOrder(order, req.user);
    } else if (status === "PICKED_UP" || status === "DELIVERING" || status === "DELIVERED") {
      if (req.user.role !== "shipper" && !isAdmin) {
        return res.status(403).json({ success: false, message: "Chỉ shipper mới có thể cập nhật tiến trình giao hàng" });
      }
      if (!delivery || String(delivery.shipperId) !== String(req.user._id)) {
        return res.status(400).json({ success: false, message: "Bạn chưa được phân công đơn giao này" });
      }
      order.status = status;
      delivery.status = status;
      delivery.history.push({ status, note: "Cập nhật từ shipper" });
      await delivery.save();
    } else if (status === "COMPLETED") {
      if (!isBuyer && !isAdmin) {
        return res.status(403).json({ success: false, message: "Chỉ người mua mới có thể hoàn tất đơn" });
      }
      if (!["DELIVERING", "DELIVERED"].includes(order.status)) {
        return res.status(400).json({ success: false, message: "Đơn hàng chưa ở giai đoạn có thể hoàn tất" });
      }
      order.status = "COMPLETED";
      await commitOrderInventory(order._id);
      if (delivery) {
        delivery.status = "COMPLETED";
        delivery.history.push({ status: "COMPLETED", note: "Người mua xác nhận đã nhận hàng" });
        await delivery.save();
      }
    } else {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    await order.save();
    const [data] = await loadOrdersWithRelations({ _id: order._id });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAvailableOrdersForShipper = async (req, res) => {
  try {
    const deliveries = await Delivery.find({ status: "WAITING_SHIPPER", shipperId: null }).lean();
    const orderIds = deliveries.map((item) => item.orderId);
    const data = await loadOrdersWithRelations({ _id: { $in: orderIds }, status: "SELLER_CONFIRMED" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const acceptOrderForShipper = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    const delivery = await Delivery.findOne({ orderId: req.params.id });

    if (!order || !delivery) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn giao" });
    }

    if (delivery.status !== "WAITING_SHIPPER" || delivery.shipperId) {
      return res.status(400).json({ success: false, message: "Đơn giao này đã có shipper nhận" });
    }

    delivery.shipperId = req.user._id;
    delivery.status = "PICKING_UP";
    delivery.history.push({ status: "SHIPPER_ACCEPTED", note: "Shipper đã nhận đơn" });
    delivery.history.push({ status: "PICKING_UP", note: "Shipper đang đến lấy hàng" });
    await delivery.save();

    order.status = "PICKING_UP";
    await order.save();

    const [data] = await loadOrdersWithRelations({ _id: order._id });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({ shipperId: req.user._id }).lean();
    const orderIds = deliveries.map((item) => item.orderId);
    const data = await loadOrdersWithRelations({ _id: { $in: orderIds } });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createInspection = async (req, res) => {
  try {
    const { orderId, inspectionType, status, notes } = req.body;
    const delivery = await Delivery.findOne({ orderId });

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Không tìm thấy delivery cho đơn hàng này" });
    }

    if (String(delivery.shipperId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Bạn không có quyền tạo biên bản kiểm tra" });
    }

    const inspection = await DeliveryInspection.create({
      deliveryId: delivery._id,
      shipperId: req.user._id,
      inspectionType: inspectionType === "RECEIVE" ? "receive" : "pickup",
      conditionNote: notes || "",
      isMatchDescription: status !== "REJECTED",
      isDamagedByShipper: false,
    });

    res.status(201).json({ success: true, data: inspection });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCheckoutPreview,
  createOrder,
  vnpayReturn,
  getMyOrders,
  getMySales,
  getOrderById,
  updateOrderStatus,
  getAvailableOrdersForShipper,
  acceptOrderForShipper,
  getMyDeliveries,
  createInspection,
};
