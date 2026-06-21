export const orderStatusMap = {
  pending: { label: "Chờ xác nhận", variant: "warning" },
  confirmed: { label: "Đã xác nhận", variant: "success" },
  shipping: { label: "Đang giao", variant: "sky" },
  delivered: { label: "Chờ người mua xác nhận", variant: "warning" },
  completed: { label: "Hoàn tất", variant: "success" },
  cancelled: { label: "Đã hủy", variant: "danger" },
};

export const deliveryStatusMap = {
  pending: { label: "Chờ shipper nhận", variant: "warning" },
  accepted: { label: "Shipper đã nhận đơn", variant: "sky" },
  picking_up: { label: "Đang lấy hàng", variant: "sky" },
  picked_up: { label: "Đã lấy hàng, chờ kiểm tra", variant: "warning" },
  in_transit: { label: "Đang giao đến người mua", variant: "sky" },
  delivered: { label: "Đã giao thành công", variant: "success" },
  completed: { label: "Hoàn tất delivery", variant: "success" },
  failed: { label: "Giao thất bại", variant: "danger" },
};

export function getOrderStatusInfo(status) {
  return orderStatusMap[status] || { label: status || "Không xác định", variant: "muted" };
}

export function getDeliveryStatusInfo(status) {
  return deliveryStatusMap[status] || { label: status || "Chưa tạo delivery", variant: "muted" };
}

export function buildOrderTimeline(order) {
  const deliveryHistory = (order.delivery?.history || []).map((item) => ({
    label: getDeliveryStatusInfo(item.status).label,
    note: item.note || "",
    timestamp: item.timestamp,
    kind: "delivery",
    active: true,
  }));

  const items = [
    {
      label: "Đơn hàng được tạo",
      note: "Người mua đã gửi yêu cầu mua hàng.",
      timestamp: order.createdAt,
      kind: "order",
      active: true,
    },
    {
      label: getOrderStatusInfo(order.orderStatus).label,
      note:
        order.orderStatus === "cancelled"
          ? order.cancelReason || "Đơn hàng đã bị hủy."
          : order.orderStatus === "completed"
            ? "Người mua đã xác nhận nhận hàng và kết thúc giao dịch."
            : "Trạng thái hiện tại của đơn hàng.",
      timestamp: order.updatedAt,
      kind: "order",
      active: true,
    },
  ];

  return [...items, ...deliveryHistory].sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
}
