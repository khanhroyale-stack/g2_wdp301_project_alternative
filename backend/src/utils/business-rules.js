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
  if (result === "failed" && checks.every((value) => value !== false)) return "Can danh dau it nhat mot tieu chi khong dat";
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
    picking_up: ["failed"],
    picked_up: ["received", "in_transit", "failed"],
    ready_for_delivery: ["received", "inspection_failed", "failed"],
    received: ["in_transit", "failed"],
    in_transit: ["delivered", "failed"],
    delivered: [],
    completed: [],
    inspection_failed: ["failed"],
    failed: ["failed"],
    pending: ["accepted", "picking_up", "failed"],
  };
  return transitions[currentStatus]?.includes(nextStatus) || false;
};

const buildAvailableDeliveryClaimFilter = (deliveryId) => ({
  _id: deliveryId,
  shipperId: null,
  status: "WAITING_SHIPPER",
});

const PRO_PLANS = {
  "1m": { durationMonths: 1, durationDays: 30, amount: 50000 },
  "3m": { durationMonths: 3, durationDays: 90, amount: 120000 },
  "12m": { durationMonths: 12, durationDays: 365, amount: 400000 },
};

const FREE_POST_LIMIT = 5;
const MAX_FEATURED_PRODUCTS = 3;

const isUserPro = (user) => {
  const expiry = user?.proExpiresAt;
  return !!(expiry && new Date(expiry).getTime() > Date.now());
};

const computeProExpiry = (currentExpiry, durationDays, now = new Date()) => {
  const nowMs = now.getTime();
  const currentMs = currentExpiry ? new Date(currentExpiry).getTime() : 0;
  const base = new Date(Math.max(nowMs, currentMs));
  const days = Math.max(Number(durationDays) || 0, 0);
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
};

module.exports = {
  normalizeInspectionOutcome,
  buildAvailableDeliveryClaimFilter,
  getProductAvailabilityStatus,
  isDeliveryTransitionAllowed,
  validateInspectionOutcome,
  validateProductBusinessRules,
  validateSellerCancellation,
  PRO_PLANS,
  FREE_POST_LIMIT,
  MAX_FEATURED_PRODUCTS,
  isUserPro,
  computeProExpiry,
};
