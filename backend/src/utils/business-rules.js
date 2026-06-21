const validateProductBusinessRules = (payload) => {
  const type = payload.productType;
  if (!["sale", "rent", "both"].includes(type)) return "Loai san pham khong hop le";

  if (["sale", "both"].includes(type)) {
    if (!Number.isFinite(Number(payload.salePrice)) || Number(payload.salePrice) <= 0) {
      return "Gia ban phai lon hon 0";
    }
    if (!Number.isInteger(Number(payload.quantity)) || Number(payload.quantity) < 1) {
      return "So luong san pham phai la so nguyen lon hon 0";
    }
  }

  if (["rent", "both"].includes(type) && (!Number.isFinite(Number(payload.rentPricePerDay)) || Number(payload.rentPricePerDay) <= 0)) {
    return "Gia thue moi ngay phai lon hon 0";
  }

  return null;
};

const normalizeInspectionOutcome = (result, faultType) => {
  if (result === "failed_seller_fault") return { result: "failed", faultType: "seller" };
  if (result === "failed_shipper_fault") return { result: "failed", faultType: "shipper" };
  return { result, faultType: faultType || null };
};

const validateInspectionOutcome = ({ result, faultType, checks }) => {
  if (!["passed", "failed"].includes(result)) return "Ket qua kiem dinh khong hop le";
  if (result === "failed" && !["seller", "shipper"].includes(faultType)) return "Can xac dinh loi thuoc seller hay shipper";
  if (result === "passed" && checks.some((value) => value === false)) return "Khong the ket luan dat khi co tieu chi khong dat";
  return null;
};

const validateSellerCancellation = ({ isSeller, status, cancelReason }) => {
  if (isSeller && status === "cancelled" && !cancelReason?.trim()) return "Seller phai nhap ly do tu choi don hang";
  return null;
};

const getProductAvailabilityStatus = (quantity, soldIfEmpty = false) => (
  Number(quantity) > 0 ? "available" : soldIfEmpty ? "sold" : "inactive"
);

const isDeliveryTransitionAllowed = (currentStatus, nextStatus) => {
  const transitions = {
    accepted: ["picking_up", "failed"],
    picking_up: ["picked_up", "failed"],
    picked_up: ["in_transit", "failed"],
    in_transit: ["delivered", "failed"],
    delivered: [],
    completed: [],
    failed: [],
    pending: [],
  };
  return transitions[currentStatus]?.includes(nextStatus) || false;
};

const buildAvailableDeliveryClaimFilter = (deliveryId) => ({
  _id: deliveryId,
  shipperId: null,
  deliveryStatus: "pending",
});

module.exports = {
  normalizeInspectionOutcome,
  buildAvailableDeliveryClaimFilter,
  getProductAvailabilityStatus,
  isDeliveryTransitionAllowed,
  validateInspectionOutcome,
  validateProductBusinessRules,
  validateSellerCancellation,
};
