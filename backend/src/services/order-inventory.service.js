const Order = require("../models/order.model");
const ProductPost = require("../models/product_post.model");
const { getProductAvailabilityStatus } = require("../utils/business-rules");

const AVAILABLE_PRODUCT_STATUSES = ["approved", "available"];

const syncProductAvailability = async (productId, soldIfEmpty = false) => {
  const product = await ProductPost.findById(productId).select("quantity postStatus");
  if (!product) return null;
  const nextStatus = getProductAvailabilityStatus(product.quantity, soldIfEmpty);
  if (product.postStatus !== nextStatus) {
    product.postStatus = nextStatus;
    await product.save();
  }
  return product;
};

const reserveProductQuantity = async (productId, requestedQuantity) => {
  const quantity = Math.max(Number(requestedQuantity) || 1, 1);
  const product = await ProductPost.findOneAndUpdate(
    { _id: productId, quantity: { $gte: quantity }, postStatus: { $in: AVAILABLE_PRODUCT_STATUSES } },
    { $inc: { quantity: -quantity } },
    { new: true }
  );
  if (!product) return null;
  await syncProductAvailability(productId);
  return product;
};

const releaseProductQuantity = async (productId, quantityToRelease) => {
  const quantity = Math.max(Number(quantityToRelease) || 0, 0);
  if (!productId || !quantity) return null;
  await ProductPost.findByIdAndUpdate(productId, { $inc: { quantity } });
  return syncProductAvailability(productId);
};

// The conditional order update makes cancellation idempotent, including concurrent requests.
const releaseOrderInventory = async (orderId) => {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, inventoryStatus: { $in: ["reserved", null] } },
    { $set: { inventoryStatus: "released" } },
    { new: false }
  ).select("postId quantity");
  if (!order) return false;
  await releaseProductQuantity(order.postId, order.quantity);
  return true;
};

const commitOrderInventory = async (orderId) => {
  await Order.findOneAndUpdate(
    { _id: orderId, inventoryStatus: { $in: ["reserved", null] } },
    { $set: { inventoryStatus: "committed" } }
  );
};

module.exports = { commitOrderInventory, releaseOrderInventory, releaseProductQuantity, reserveProductQuantity, syncProductAvailability };
