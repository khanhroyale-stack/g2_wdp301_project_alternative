const Delivery = require("../models/delivery.model");
const Order = require("../models/order.model");
const { createNotification } = require("../controllers/notification.controller");
const { commitOrderInventory, syncProductAvailability } = require("./order-inventory.service");

const AUTO_COMPLETE_DAYS = 3;
const AUTO_COMPLETE_MS = AUTO_COMPLETE_DAYS * 24 * 60 * 60 * 1000;

const autoCompleteExpiredDeliveredOrders = async (io) => {
  const cutoff = new Date(Date.now() - AUTO_COMPLETE_MS);
  const orders = await Order.find({
    orderStatus: "delivered",
    updatedAt: { $lte: cutoff },
  })
    .populate("postId", "title")
    .lean();

  for (const order of orders) {
    const delivery = await Delivery.findOne({
      orderId: order._id,
      deliveryStatus: "delivered",
    });

    if (!delivery) continue;

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, orderStatus: "delivered" },
      { $set: { orderStatus: "completed", cancelReason: "" } },
      { new: true }
    ).lean();

    if (!updatedOrder) continue;

    delivery.deliveryStatus = "completed";
    delivery.history.push({
      status: "completed",
      note: "He thong tu dong xac nhan hoan tat sau 3 ngay ke tu khi shipper giao thanh cong.",
      timestamp: new Date(),
    });
    await delivery.save();
    await commitOrderInventory(order._id);
    await syncProductAvailability(order.postId?._id || order.postId, true);

    const productTitle = order.postId?.title || "sản phẩm";
    await Promise.all([
      createNotification({
        recipientId: order.buyerId,
        type: "order_update",
        title: "Đơn hàng đã tự động hoàn tất",
        content: `Đơn hàng "${productTitle}" đã tự động chuyển sang hoàn tất sau 3 ngày kể từ khi shipper xác nhận giao thành công.`,
        relatedType: "order",
        relatedId: order._id,
        link: `/orders/${order._id}`,
      }, io),
      createNotification({
        recipientId: order.sellerId,
        type: "order_update",
        title: "Đơn bán đã hoàn tất",
        content: `Đơn bán "${productTitle}" đã tự động hoàn tất sau thời gian chờ người mua xác nhận.`,
        relatedType: "order",
        relatedId: order._id,
        link: `/orders/${order._id}`,
      }, io),
    ]);
  }

  return orders.length;
};

module.exports = {
  AUTO_COMPLETE_DAYS,
  autoCompleteExpiredDeliveredOrders,
};
