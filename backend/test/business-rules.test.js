const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeInspectionOutcome,
  buildAvailableDeliveryClaimFilter,
  getProductAvailabilityStatus,
  isDeliveryTransitionAllowed,
  validateInspectionOutcome,
  validateProductBusinessRules,
  validateSellerCancellation,
} = require("../src/utils/business-rules");

test("sale product requires positive price and integer quantity", () => {
  assert.equal(validateProductBusinessRules({ productType: "sale", salePrice: 0, quantity: 1 }), "Gia ban phai lon hon 0");
  assert.equal(validateProductBusinessRules({ productType: "sale", salePrice: 1000, quantity: 0 }), "So luong san pham phai la so nguyen lon hon 0");
  assert.equal(validateProductBusinessRules({ productType: "sale", salePrice: 1000, quantity: 2 }), null);
});

test("rent product requires positive daily price", () => {
  assert.equal(validateProductBusinessRules({ productType: "rent", rentPricePerDay: 0 }), "Gia thue moi ngay phai lon hon 0");
  assert.equal(validateProductBusinessRules({ productType: "rent", rentPricePerDay: 50000 }), null);
});

test("legacy inspection values normalize into result and faultType", () => {
  assert.deepEqual(normalizeInspectionOutcome("failed_seller_fault"), { result: "failed", faultType: "seller" });
  assert.deepEqual(normalizeInspectionOutcome("failed_shipper_fault"), { result: "failed", faultType: "shipper" });
});

test("passed inspection cannot contain a failed check", () => {
  assert.equal(validateInspectionOutcome({ result: "passed", faultType: null, checks: [true, false] }), "Khong the ket luan dat khi co tieu chi khong dat");
  assert.equal(validateInspectionOutcome({ result: "failed", faultType: "seller", checks: [false] }), null);
});

test("seller rejection requires a reason", () => {
  assert.equal(validateSellerCancellation({ isSeller: true, status: "cancelled", cancelReason: " " }), "Seller phai nhap ly do tu choi don hang");
  assert.equal(validateSellerCancellation({ isSeller: false, status: "cancelled", cancelReason: "" }), null);
});

test("reserved inventory is inactive until the order is completed", () => {
  assert.equal(getProductAvailabilityStatus(3), "available");
  assert.equal(getProductAvailabilityStatus(0), "inactive");
  assert.equal(getProductAvailabilityStatus(0, true), "sold");
});

test("delivery transitions must follow the required sequence", () => {
  assert.equal(isDeliveryTransitionAllowed("accepted", "picking_up"), true);
  assert.equal(isDeliveryTransitionAllowed("picked_up", "in_transit"), true);
  assert.equal(isDeliveryTransitionAllowed("in_transit", "delivered"), true);
  assert.equal(isDeliveryTransitionAllowed("accepted", "delivered"), false);
  assert.equal(isDeliveryTransitionAllowed("delivered", "in_transit"), false);
});

test("delivery claim is restricted to an unassigned pending delivery", () => {
  assert.deepEqual(buildAvailableDeliveryClaimFilter("delivery-id"), {
    _id: "delivery-id",
    shipperId: null,
    deliveryStatus: "pending",
  });
});
