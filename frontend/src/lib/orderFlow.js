export const orderStatusMap = {
  pending: { label: "Chờ xác nhận", variant: "warning" },
  confirmed: { label: "Đã xác nhận", variant: "success" },
  shipping: { label: "Đang giao", variant: "sky" },
  delivered: { label: "Chờ người mua xác nhận", variant: "warning" },
  completed: { label: "Hoàn tất", variant: "success" },
  cancelled: { label: "Đã hủy", variant: "danger" },
};

// Map UI status (lowercase) → tên tiếng Việt
export const deliveryStatusMap = {
  pending: { label: "Chờ shipper nhận", variant: "warning" },
  accepted: { label: "Shipper đã nhận đơn", variant: "sky" },
  picking_up: { label: "Đang đến điểm lấy hàng", variant: "sky" },
  picked_up: { label: "Đã đến lấy hàng", variant: "warning" },
  ready_for_delivery: { label: "Sẵn sàng giao hàng", variant: "warning" },
  received: { label: "Đã kiểm tra và nhận hàng", variant: "success" },
  in_transit: { label: "Đang giao hàng đến người mua", variant: "sky" },
  delivered: { label: "Đã giao thành công", variant: "success" },
  completed: { label: "Hoàn tất giao hàng", variant: "success" },
  inspection_failed: { label: "Giao hàng không thành công", variant: "danger" },
  failed: { label: "Giao hàng không thành công", variant: "danger" },
};

// Map DB raw status (UPPERCASE) → UI status (lowercase) - dùng cho dữ liệu cũ
const RAW_TO_UI_STATUS = {
  WAITING_SHIPPER: "pending",
  SHIPPER_ACCEPTED: "accepted",
  PICKING_UP: "picking_up",
  PICKED_UP: "picked_up",
  DELIVERING: "in_transit",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  FAILED: "failed",
};

export function getOrderStatusInfo(status) {
  return orderStatusMap[status] || { label: status || "Không xác định", variant: "muted" };
}

export function getDeliveryStatusInfo(status) {
  if (!status) return { label: "Chưa tạo delivery", variant: "muted" };
  // Normalize uppercase DB status về lowercase UI status trước khi tra cứu
  const normalized = RAW_TO_UI_STATUS[status] || status;
  return deliveryStatusMap[normalized] || { label: status, variant: "muted" };
}

export function normalizeVietnameseNote(note = "") {
  if (!note) return "";
  let str = String(note);
  str = str.replace(/Shipper da nhan don giao hang\.?/gi, "Shipper đã nhận đơn giao hàng.");
  str = str.replace(/Shipper da nhan don\.?/gi, "Shipper đã nhận đơn.");
  str = str.replace(/Shipper dang di den diem lay hang\.?/gi, "Shipper đang đi đến điểm lấy hàng.");
  str = str.replace(/Shipper dang den lay hang\.?/gi, "Shipper đang đi đến điểm lấy hàng.");
  str = str.replace(/Kiem tra san pham that bai\. Tieu chi khong dat: Dung san pham theo don dang ban\.?/gi, "Giao hàng không thành công do kiểm tra không đạt: Sản phẩm không khớp mô tả trên đơn bán.");
  str = str.replace(/Giao hàng thất bại do kiểm tra không đạt:/gi, "Giao hàng không thành công do kiểm tra không đạt:");
  str = str.replace(/Kiem tra san pham that bai\.?/gi, "Kiểm tra sản phẩm không đạt.");
  str = str.replace(/Tieu chi khong dat:/gi, "Tiêu chí không đạt:");
  str = str.replace(/Dung san pham theo don dang ban\.?/gi, "Đúng sản phẩm theo đơn đăng bán.");
  str = str.replace(/toi bi tai nan/gi, "Sự cố phát sinh trong quá trình vận chuyển (Tai nạn/phương tiện).");
  str = str.replace(/Giao hang that bai/gi, "Giao hàng không thành công");
  str = str.replace(/Giao hàng thất bại/gi, "Giao hàng không thành công");
  return str;
}

export function buildDeliveryTimeline(delivery) {
  if (!delivery) return [];
  const history = Array.isArray(delivery.history) ? delivery.history : [];

  const getHistoryItem = (statuses) => {
    return history.find((h) => {
      const s = String(h.status || "").toLowerCase();
      return statuses.some((st) => s === st.toLowerCase() || (h.status || "") === st);
    });
  };

  const hasReachedStatus = (statuses) => {
    const current = String(delivery.deliveryStatus || delivery.status || "").toLowerCase();
    if (statuses.some((st) => current === st.toLowerCase() || (delivery.deliveryStatus || delivery.status || "") === st)) return true;
    return Boolean(getHistoryItem(statuses));
  };

  const steps = [];
  const addStep = (status, label, note, timestamp, variant = "sky", weight = 0) => {
    steps.push({
      status,
      label,
      note: normalizeVietnameseNote(note),
      timestamp: timestamp || null,
      variant,
      weight,
    });
  };

  // Bước 0: Nếu đơn CHƯA AI NHẬN (chỉ có waiting_shipper / pending)
  const st_accepted = ["accepted", "shipper_accepted", "SHIPPER_ACCEPTED", "picking_up", "PICKING_UP", "picked_up", "PICKED_UP", "ready_for_delivery", "received", "in_transit", "delivering", "DELIVERING", "delivered", "DELIVERED", "completed", "COMPLETED", "failed", "FAILED", "inspection_failed"];
  if (!hasReachedStatus(st_accepted) && !delivery.shipperId) {
    const item = getHistoryItem(["waiting_shipper", "WAITING_SHIPPER", "pending"]);
    addStep(
      "WAITING_SHIPPER",
      "Chờ shipper nhận",
      item?.note || "Seller đã xác nhận đơn hàng, đang chờ Shipper tiếp nhận.",
      item?.timestamp || item?.changedAt || delivery.createdAt,
      "warning",
      2
    );
    return steps;
  }

  // 1. NHẬN ĐƠN (Chỉ hiển thị khi shipper đã nhận, ẩn hoàn toàn bước Chờ shipper nhận)
  const itemAccept = getHistoryItem(["accepted", "shipper_accepted", "SHIPPER_ACCEPTED", "picking_up", "PICKING_UP"]) || getHistoryItem(st_accepted);
  const tsAccept = itemAccept?.timestamp || itemAccept?.changedAt || delivery.createdAt;
  addStep(
    "SHIPPER_ACCEPTED",
    "Nhận đơn",
    "Shipper đã nhận đơn giao hàng từ người bán.",
    tsAccept,
    "sky",
    4
  );

  // 2. ĐẾN VÀ KIỂM TRA HÀNG
  const st_inspected = ["picked_up", "PICKED_UP", "ready_for_delivery", "received", "in_transit", "delivering", "DELIVERING", "delivered", "DELIVERED", "completed", "COMPLETED"];
  const st_fail = ["failed", "FAILED", "inspection_failed"];

  if (hasReachedStatus(st_inspected)) {
    const itemInsp = getHistoryItem(["picked_up", "PICKED_UP", "ready_for_delivery", "received"]) || getHistoryItem(st_inspected);
    const tsInsp = itemInsp?.timestamp || itemInsp?.changedAt || delivery.updatedAt;
    addStep(
      "PICKED_UP",
      "Đến và kiểm tra hàng",
      itemInsp?.note || "Shipper đã đến và kiểm tra hàng thành công. Sản phẩm khớp mô tả trên đơn bán.",
      tsInsp,
      "success",
      5
    );
  } else if (hasReachedStatus(st_fail) || delivery.status === "FAILED" || delivery.deliveryStatus === "failed" || delivery.status === "INSPECTION_FAILED" || delivery.deliveryStatus === "inspection_failed") {
    const itemFail = getHistoryItem(st_fail);
    const tsFail = itemFail?.timestamp || itemFail?.changedAt || delivery.updatedAt;
    addStep(
      "PICKING_UP",
      "Đến và kiểm tra hàng",
      "Shipper đã đến điểm lấy hàng và thực hiện kiểm tra sản phẩm.",
      tsFail,
      "sky",
      5
    );
  } else if (hasReachedStatus(["picking_up", "PICKING_UP"])) {
    const itemPick = getHistoryItem(["picking_up", "PICKING_UP"]);
    const tsPick = itemPick?.timestamp || itemPick?.changedAt || delivery.updatedAt;
    addStep(
      "PICKING_UP",
      "Đến và kiểm tra hàng",
      itemPick?.note || "Shipper đang đến điểm lấy hàng và thực hiện kiểm tra sản phẩm.",
      tsPick,
      "sky",
      5
    );
  }

  // 3. GIAO HÀNG (Chỉ hiển thị nếu đã kiểm tra thành công và đang giao / đã giao)
  const st_delivering = ["in_transit", "delivering", "DELIVERING", "delivered", "DELIVERED", "completed", "COMPLETED"];
  if (hasReachedStatus(st_delivering)) {
    const itemDeliv = getHistoryItem(["in_transit", "delivering", "DELIVERING"]) || getHistoryItem(st_delivering);
    const tsDeliv = itemDeliv?.timestamp || itemDeliv?.changedAt || delivery.updatedAt;
    addStep(
      "DELIVERING",
      "Giao hàng",
      itemDeliv?.note || "Shipper đang giao hàng đến địa chỉ người mua.",
      tsDeliv,
      "sky",
      6
    );
  }

  // 4. KẾT QUẢ: GIAO HÀNG THÀNH CÔNG HOGAY GIAO HÀNG KHÔNG THÀNH CÔNG KÈM LÝ DO
  const st_success = ["delivered", "DELIVERED", "completed", "COMPLETED"];
  if (hasReachedStatus(st_success) || delivery.status === "DELIVERED" || delivery.status === "COMPLETED" || delivery.deliveryStatus === "delivered" || delivery.deliveryStatus === "completed") {
    const itemSucc = getHistoryItem(st_success);
    const tsSucc = itemSucc?.timestamp || itemSucc?.changedAt || delivery.updatedAt;
    addStep(
      "DELIVERED",
      "Giao hàng thành công",
      itemSucc?.note || "Shipper đã giao hàng thành công tới tay người mua.",
      tsSucc,
      "success",
      7
    );
  } else if (hasReachedStatus(st_fail) || delivery.status === "FAILED" || delivery.deliveryStatus === "failed" || delivery.status === "INSPECTION_FAILED" || delivery.deliveryStatus === "inspection_failed") {
    const itemFail = getHistoryItem(st_fail);
    const tsFail = itemFail?.timestamp || itemFail?.changedAt || delivery.updatedAt;
    const rawReason = delivery.failureReason || itemFail?.note || "Giao hàng không thành công do kiểm tra không đạt.";
    addStep(
      "FAILED",
      "Giao hàng không thành công",
      rawReason,
      tsFail,
      "danger",
      7
    );
  }

  // Sắp xếp tăng dần theo thời gian (từ bắt đầu đến kết thúc), nếu trùng thời gian thì sắp theo trọng số bước
  return steps.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return (a.weight || 0) - (b.weight || 0);
  });
}

export function buildOrderTimeline(order) {
  if (!order) return [];
  const delivery = order.delivery || null;
  const history = Array.isArray(delivery?.history) ? delivery.history : [];

  const getHistoryItem = (statuses) => {
    return history.find((h) => {
      const s = (h.status || "").toLowerCase();
      return statuses.some((st) => s === st.toLowerCase() || (h.status || "") === st);
    });
  };

  const hasReachedStatus = (statuses) => {
    const current = (delivery?.deliveryStatus || delivery?.status || "").toLowerCase();
    if (statuses.some((st) => current === st.toLowerCase() || (delivery?.deliveryStatus || delivery?.status || "") === st)) return true;
    return Boolean(getHistoryItem(statuses));
  };

  const steps = [];
  const addStep = (key, title, description, timestamp, tone = "success", weight = 0) => {
    steps.push({ key, title, description: normalizeVietnameseNote(description), timestamp: timestamp || null, tone, weight });
  };

  // 1. Đặt hàng thành công
  addStep(
    "created",
    "Đặt hàng thành công",
    "Đơn hàng đã được ghi nhận vào hệ thống.",
    order.createdAt,
    "success",
    1
  );

  // Nếu đơn đang chờ xác nhận
  if (order.orderStatus === "pending") {
    addStep("pending", "Chờ người bán xác nhận", "Người bán đang chuẩn bị và xác nhận đơn hàng.", order.updatedAt, "warning", 2);
  }

  // 2. Người bán xác nhận đơn
  const confirmedTime = getHistoryItem(["pending", "WAITING_SHIPPER"])?.timestamp || getHistoryItem(["pending", "WAITING_SHIPPER"])?.changedAt || delivery?.createdAt || (order.orderStatus !== "pending" && order.orderStatus !== "cancelled" ? order.updatedAt : null);
  if (order.orderStatus !== "pending" && (order.orderStatus !== "cancelled" || delivery)) {
    addStep(
      "seller_confirmed",
      "Người bán đã xác nhận",
      "Seller đã xác nhận đơn hàng và chuẩn bị giao cho shipper.",
      confirmedTime,
      "success",
      3
    );
  }

  // 3. Shipper nhận đơn
  const st1 = ["accepted", "shipper_accepted", "SHIPPER_ACCEPTED", "picking_up", "PICKING_UP", "picked_up", "PICKED_UP", "ready_for_delivery", "received", "in_transit", "delivering", "DELIVERING", "delivered", "DELIVERED", "completed", "COMPLETED"];
  if (hasReachedStatus(st1)) {
    const itemAccept = getHistoryItem(["accepted", "shipper_accepted", "SHIPPER_ACCEPTED", "picking_up", "PICKING_UP"]) || getHistoryItem(st1);
    const ts = itemAccept?.timestamp || itemAccept?.changedAt || delivery?.createdAt || order.updatedAt;
    addStep(
      "shipper_accepted",
      "Nhận đơn",
      itemAccept?.note || "Shipper đã nhận đơn giao hàng từ người bán.",
      ts,
      "info",
      4
    );
  }

  // 4. Đến lấy hàng & Kiểm tra
  const st2_pass = ["picked_up", "PICKED_UP", "ready_for_delivery", "received", "in_transit", "delivering", "DELIVERING", "delivered", "DELIVERED", "completed", "COMPLETED"];
  const st2_fail = ["inspection_failed", "failed", "FAILED"];
  if (hasReachedStatus(st2_fail) || delivery?.deliveryStatus === "inspection_failed" || delivery?.status === "FAILED") {
    const item = getHistoryItem(st2_fail);
    const ts = item?.timestamp || item?.changedAt || delivery?.updatedAt || order.updatedAt;
    addStep(
      "picking_up",
      "Đến và kiểm tra hàng",
      "Shipper đã đến điểm lấy hàng và thực hiện kiểm tra sản phẩm.",
      ts,
      "info",
      5
    );
    addStep(
      "inspection_failed",
      "Giao hàng không thành công",
      delivery?.failureReason || item?.note || "Giao hàng không thành công do kiểm tra không đạt.",
      ts,
      "danger",
      7
    );
  } else if (hasReachedStatus(st2_pass)) {
    const item = getHistoryItem(["received", "picked_up", "PICKED_UP", "ready_for_delivery"]) || getHistoryItem(st2_pass);
    const ts = item?.timestamp || item?.changedAt || delivery?.updatedAt || order.updatedAt;
    addStep(
      "inspected_passed",
      "Đến và kiểm tra hàng",
      item?.note || "Shipper đã đến và kiểm tra hàng thành công. Sản phẩm khớp mô tả trên đơn bán.",
      ts,
      "success",
      5
    );
  } else if (hasReachedStatus(["picking_up", "PICKING_UP"])) {
    const item = getHistoryItem(["picking_up", "PICKING_UP"]);
    const ts = item?.timestamp || item?.changedAt || delivery?.updatedAt || order.updatedAt;
    addStep(
      "picking_up",
      "Đến và kiểm tra hàng",
      item?.note || "Shipper đang đến điểm lấy hàng và thực hiện kiểm tra sản phẩm.",
      ts,
      "info",
      5
    );
  }

  // 5. Đang giao hàng đến người mua
  const st3 = ["in_transit", "delivering", "DELIVERING", "delivered", "DELIVERED", "completed", "COMPLETED"];
  if (hasReachedStatus(st3) || (!delivery && order.orderStatus === "shipping") || (!delivery && order.orderStatus === "delivered") || order.orderStatus === "completed") {
    const item = getHistoryItem(["in_transit", "delivering", "DELIVERING"]) || getHistoryItem(st3);
    const ts = item?.timestamp || item?.changedAt || delivery?.updatedAt || order.updatedAt;
    addStep(
      "in_transit",
      "Giao hàng",
      item?.note || "Shipper đang giao hàng đến địa chỉ người mua.",
      ts,
      "info",
      6
    );
  }

  // 6. Đã giao hàng thành công
  const st4 = ["delivered", "DELIVERED", "completed", "COMPLETED"];
  if (hasReachedStatus(st4) || (!delivery && order.orderStatus === "delivered") || order.orderStatus === "completed") {
    const item = getHistoryItem(st4);
    const ts = item?.timestamp || item?.changedAt || delivery?.updatedAt || order.updatedAt;
    addStep(
      "delivered",
      "Giao hàng thành công",
      order.orderStatus === "completed"
        ? "Người mua đã xác nhận nhận hàng. Hoàn tất đơn hàng."
        : item?.note || "Shipper đã giao hàng thành công tới tay người mua.",
      ts,
      "success",
      7
    );
  }

  // Nếu đơn bị hủy từ trước hoặc bất kỳ lúc nào
  if (order.orderStatus === "cancelled" && !hasReachedStatus(st2_fail)) {
    addStep(
      "cancelled",
      "Đơn hàng đã hủy",
      order.cancelReason || delivery?.failureReason || "Đơn hàng đã được hủy và tồn kho đã được hoàn lại.",
      order.updatedAt || delivery?.updatedAt,
      "danger",
      7
    );
  }

  // Lọc trùng theo title và sắp xếp giảm dần theo thời gian (mới nhất lên trên), nếu trùng giây thì ưu tiên bước có trọng số (weight) cao hơn ở trên
  const seen = new Set();
  const unique = steps.filter((step) => {
    if (seen.has(step.title)) return false;
    seen.add(step.title);
    return true;
  });

  return unique.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : -Infinity;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : -Infinity;
    if (tb !== ta) return tb - ta;
    return (b.weight || 0) - (a.weight || 0);
  });
}
