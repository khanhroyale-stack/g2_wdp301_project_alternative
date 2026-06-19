export const orderStatusMap = {
  pending: { label: "Cho xac nhan", variant: "warning" },
  confirmed: { label: "Da xac nhan", variant: "success" },
  shipping: { label: "Dang giao", variant: "sky" },
  delivered: { label: "Cho buyer xac nhan", variant: "warning" },
  completed: { label: "Hoan tat", variant: "success" },
  cancelled: { label: "Da huy", variant: "danger" },
};

export const deliveryStatusMap = {
  pending: { label: "Cho shipper nhan", variant: "warning" },
  accepted: { label: "Shipper da nhan don", variant: "sky" },
  picking_up: { label: "Dang lay hang", variant: "sky" },
  picked_up: { label: "Da lay hang, cho kiem tra", variant: "warning" },
  in_transit: { label: "Dang giao den buyer", variant: "sky" },
  delivered: { label: "Da giao thanh cong", variant: "success" },
  completed: { label: "Hoan tat delivery", variant: "success" },
  failed: { label: "Giao that bai", variant: "danger" },
};

export function getOrderStatusInfo(status) {
  return orderStatusMap[status] || { label: status || "Khong xac dinh", variant: "muted" };
}

export function getDeliveryStatusInfo(status) {
  return deliveryStatusMap[status] || { label: status || "Chua tao delivery", variant: "muted" };
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
      label: "Don hang duoc tao",
      note: "Buyer da gui yeu cau mua hang.",
      timestamp: order.createdAt,
      kind: "order",
      active: true,
    },
    {
      label: getOrderStatusInfo(order.orderStatus).label,
      note:
        order.orderStatus === "cancelled"
          ? order.cancelReason || "Don hang da bi huy."
          : order.orderStatus === "completed"
            ? "Buyer da xac nhan nhan hang va ket thuc giao dich."
            : "Trang thai hien tai cua don hang.",
      timestamp: order.updatedAt,
      kind: "order",
      active: true,
    },
  ];

  return [...items, ...deliveryHistory].sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
}
