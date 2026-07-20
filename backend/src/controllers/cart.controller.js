const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const ProductPost = require("../models/product_post.model");
const User = require("../models/user.model");
const Delivery = require("../models/delivery.model");
const { getProductThumbnailUrl } = require("../utils/product-images.util");
const { getProductAvailabilityStatus } = require("../utils/business-rules");

const SHIPPING_FEE = 35000;
const AVAILABLE_PRODUCT_STATUSES = ["approved", "available"];

const mapCartItem = async (item) => {
  const product = item.postId;
  const thumbnailUrl = product?._id ? await getProductThumbnailUrl(product._id) : null;

  return {
    productId: product?._id || null,
    quantity: item.quantity,
    addedAt: item.addedAt,
    product: product
      ? {
          ...product,
          thumbnailUrl,
          images: thumbnailUrl ? [thumbnailUrl] : [],
        }
      : null,
  };
};

const hydrateCart = async (cart) => {
  const hydratedItems = [];
  let subtotal = 0;
  let totalQuantity = 0;

  for (const item of cart.items || []) {
    const mapped = await mapCartItem(item);
    if (!mapped.product) {
      continue;
    }

    subtotal += Number(mapped.product.salePrice || 0) * Number(mapped.quantity || 1);
    totalQuantity += Number(mapped.quantity || 1);
    hydratedItems.push(mapped);
  }

  return {
    ...cart,
    items: hydratedItems,
    summary: {
      itemCount: totalQuantity,
      subtotal,
      shippingFee: hydratedItems.length ? SHIPPING_FEE * hydratedItems.length : 0,
      totalAmount: subtotal + (hydratedItems.length ? SHIPPING_FEE * hydratedItems.length : 0),
    },
  };
};

const getProductAvailabilityError = (product, viewerId, seller) => {
  if (!product) {
    return { code: 404, message: "San pham khong ton tai" };
  }

  if (!AVAILABLE_PRODUCT_STATUSES.includes(product.postStatus)) {
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

const getOrCreateCart = async (buyerId) => {
  let cart = await Cart.findOne({ buyerId });
  if (!cart) {
    cart = await Cart.create({ buyerId, items: [] });
  }
  return cart;
};

const loadCart = async (buyerId) => {
  const cart = await getOrCreateCart(buyerId);
  const populated = await Cart.findById(cart._id)
    .populate({
      path: "items.postId",
      populate: [
        { path: "ownerId", select: "fullName email phone accountStatus" },
        { path: "categoryId", select: "name" },
      ],
    })
    .lean();

  return hydrateCart(populated);
};

const getMyCart = async (req, res) => {
  try {
    const cart = await loadCart(req.user._id);
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addCartItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const normalizedQuantity = Math.max(Number(quantity) || 1, 1);
    if (!productId) {
      return res.status(400).json({ success: false, message: "Thieu productId" });
    }

    const product = await ProductPost.findById(productId).populate("ownerId", "accountStatus");
    const availabilityError = getProductAvailabilityError(product, req.user._id, product?.ownerId);
    if (availabilityError) {
      return res.status(availabilityError.code).json({ success: false, message: availabilityError.message });
    }

    if ((Number(product.quantity) || 0) < normalizedQuantity) {
      return res.status(400).json({
        success: false,
        message: `So luong vuot qua ton kho hien co. Chi con ${product.quantity} san pham.`,
      });
    }

    const cart = await getOrCreateCart(req.user._id);
    const existingItem = cart.items.find((item) => String(item.postId) === String(productId));
    if (existingItem) {
      existingItem.quantity = normalizedQuantity;
      existingItem.addedAt = new Date();
    } else {
      cart.items.push({
        postId: productId,
        quantity: normalizedQuantity,
        addedAt: new Date(),
      });
    }

    await cart.save();

    const hydratedCart = await loadCart(req.user._id);
    res.status(201).json({
      success: true,
      message: "Da them san pham vao gio hang",
      data: hydratedCart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter((item) => String(item.postId) !== String(req.params.productId));
    await cart.save();

    const hydratedCart = await loadCart(req.user._id);
    res.json({
      success: true,
      message: "Da xoa san pham khoi gio hang",
      data: hydratedCart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const checkoutCart = async (req, res) => {
  try {
    const { buyerAddress, buyerPhone, recipientName, note } = req.body;
    if (!buyerAddress || !buyerPhone || !recipientName) {
      return res.status(400).json({ success: false, message: "Vui long dien day du thong tin nhan hang" });
    }

    const cart = await getOrCreateCart(req.user._id);
    if (!cart.items.length) {
      return res.status(400).json({ success: false, message: "Gio hang dang trong" });
    }

    const createdOrders = [];
    const remainingItems = [];

    for (const item of cart.items) {
      const product = await ProductPost.findById(item.postId).populate("ownerId", "accountStatus");
      const availabilityError = getProductAvailabilityError(product, req.user._id, product?.ownerId);
      if (availabilityError) {
        remainingItems.push(item);
        continue;
      }

      const requestedQuantity = Math.max(Number(item.quantity) || 1, 1);
      if ((Number(product.quantity) || 0) < requestedQuantity) {
        remainingItems.push(item);
        continue;
      }

      const seller = await User.findById(product.ownerId).select("accountStatus");
      if (!seller || seller.accountStatus !== "active") {
        remainingItems.push(item);
        continue;
      }

      const updatedProduct = await ProductPost.findOneAndUpdate(
        {
          _id: product._id,
          quantity: { $gte: requestedQuantity },
          postStatus: { $in: AVAILABLE_PRODUCT_STATUSES },
        },
        { $inc: { quantity: -requestedQuantity } },
        { new: true }
      );
      if (!updatedProduct) {
        remainingItems.push(item);
        continue;
      }

      const nextStatus = getProductAvailabilityStatus(updatedProduct.quantity);
      if (updatedProduct.postStatus !== nextStatus) {
        updatedProduct.postStatus = nextStatus;
        await updatedProduct.save();
      }

      const totalAmount = Number(product.salePrice || 0) * requestedQuantity + SHIPPING_FEE;
      const order = await Order.create({
        buyerId: req.user._id,
        sellerId: product.ownerId,
        postId: product._id,
        quantity: requestedQuantity,
        productPrice: product.salePrice,
        shippingFee: SHIPPING_FEE,
        totalAmount,
        buyerAddress: buyerAddress.trim(),
        buyerPhone: buyerPhone.trim(),
        recipientName: recipientName.trim(),
        note: note || "",
        orderStatus: "pending",
      });
      createdOrders.push(order);
    }

    cart.items = remainingItems;
    await cart.save();

    if (!createdOrders.length) {
      return res.status(400).json({
        success: false,
        message: "Khong co san pham nao trong gio hang du dieu kien de tao don",
      });
    }

    const populatedOrders = await Order.find({ _id: { $in: createdOrders.map((order) => order._id) } })
      .populate("buyerId", "fullName email phone")
      .populate("sellerId", "fullName email phone address")
      .populate("postId", "title salePrice")
      .sort({ createdAt: -1 })
      .lean();

    res.status(201).json({
      success: true,
      message: "Checkout gio hang thanh cong",
      data: populatedOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyCart,
  addCartItem,
  removeCartItem,
  checkoutCart,
};
