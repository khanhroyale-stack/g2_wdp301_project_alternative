const ProductPost = require("../models/product_post.model");
const ProductImage = require("../models/product_image.model");

// Helper: gắn thumbnail URL vào mảng products
const attachThumbnails = async (products) => {
  const ids = products.map((p) => p._id);
  const images = await ProductImage.find({ postId: { $in: ids } })
    .populate("field", "publicUrl")
    .sort({ isThumbnail: -1, sortOrder: 1 });

  // Map: postId → publicUrl đầu tiên
  const thumbMap = {};
  for (const img of images) {
    const key = img.postId.toString();
    if (!thumbMap[key] && img.field?.publicUrl) {
      thumbMap[key] = img.field.publicUrl;
    }
  }
  return products.map((p) => ({
    ...p.toObject(),
    thumbnailUrl: thumbMap[p._id.toString()] || null,
  }));
};

// GET /api/products — public, có filter/search/sort
const getProducts = async (req, res) => {
  try {
    const { keyword, category, listingType, condition, minPrice, maxPrice, sort } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const filter = { postStatus: "approved" };
    if (keyword) filter.$text = { $search: keyword };
    if (category) filter.categoryId = category;

    const type = listingType || req.query.productType;
    if (type) {
      if (type === "ban" || type === "sale") filter.productType = "sale";
      else if (type === "cho-thue" || type === "rent") filter.productType = "rent";
      else filter.productType = type;
    }

    if (condition) filter.conditionStatus = condition;
    if (minPrice || maxPrice) {
      filter.$or = [
        { salePrice: { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) } },
        { rentPricePerDay: { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) } },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { salePrice: 1, rentPricePerDay: 1 },
      price_desc: { salePrice: -1, rentPricePerDay: -1 },
    };
    const sortQuery = sortMap[sort] || { createdAt: -1 };

    const total = await ProductPost.countDocuments(filter);
    const products = await ProductPost.find(filter)
      .populate("ownerId", "fullName avatarUrl reputationScore averageRating")
      .populate("categoryId", "name icon")
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit);

    const productsWithThumbs = await attachThumbnails(products);

    res.json({ success: true, data: productsWithThumbs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.params.id)
      .populate("ownerId", "fullName avatarUrl reputationScore averageRating phone")
      .populate("categoryId", "name icon");
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

    // Lấy toàn bộ ảnh của sản phẩm
    const images = await ProductImage.find({ postId: product._id })
      .populate("field", "publicUrl fileType")
      .sort({ isThumbnail: -1, sortOrder: 1 });
    const imageUrls = images.map((img) => img.field?.publicUrl).filter(Boolean);

    res.json({ success: true, data: { ...product.toObject(), imageUrls, thumbnailUrl: imageUrls[0] || null } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products — tạo bài đăng
const createProduct = async (req, res) => {
  try {
    if (req.user.accountStatus !== "APPROVED" && req.user.accountStatus !== "active") {
      return res.status(403).json({ success: false, message: "Tài khoản chưa được xác minh. Vui lòng đợi Admin duyệt." });
    }

    // Tách mediaIds ra, không lưu vào ProductPost schema
    const { mediaIds, images, ...postData } = req.body;
    const product = await ProductPost.create({ ...postData, ownerId: req.user._id, postStatus: "pending" });

    // Lưu ProductImage records raw (tránh Mongoose thêm updatedAt/__v vi phạm Atlas schema)
    const ids = Array.isArray(mediaIds) ? mediaIds : [];
    if (ids.length > 0) {
      const { Int32, ObjectId } = require("mongodb");
      const db = require("mongoose").connection.db;
      const imageDocs = ids.map((fieldId, idx) => ({
        postId: product._id,
        field: typeof fieldId === "string" ? new ObjectId(fieldId) : fieldId,
        isThumbnail: idx === 0,
        sortOrder: new Int32(idx),
        createdAt: new Date(),
      }));
      await db.collection("product_images").insertMany(imageDocs);
    }

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    if (product.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Không có quyền" });

    // Các field nhạy cảm cần duyệt lại
    const sensitiveFields = ["title", "description", "salePrice", "rentPricePerDay",
                             "rentPricePerWeek", "rentPricePerMonth", "conditionStatus"];
    const hasSensitiveChange = sensitiveFields.some(f => req.body[f] !== undefined);

    const { quantity, depositAmount, location, accessoriesNote } = req.body;

    // Chỉ update quantity/depositAmount/location không cần duyệt lại
    if (!hasSensitiveChange) {
      if (quantity !== undefined) product.quantity = Math.max(1, Number(quantity));
      if (depositAmount !== undefined) product.depositAmount = depositAmount;
      if (location !== undefined) product.location = location;
    } else {
      Object.assign(product, req.body);
      product.postStatus = "pending"; // cần duyệt lại
    }

    await product.save();
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id — ẩn bài
const deleteProduct = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    const isOwner = product.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "Không có quyền" });
    product.postStatus = "closed";
    await product.save();
    res.json({ success: true, message: "Đã ẩn bài đăng" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/my — bài của mình
const getMyProducts = async (req, res) => {
  try {
    const products = await ProductPost.find({ ownerId: req.user._id })
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });
    const productsWithThumbs = await attachThumbnails(products);
    res.json({ success: true, data: productsWithThumbs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin
const adminGetProducts = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { postStatus: status } : {};
    const products = await ProductPost.find(filter)
      .populate("ownerId", "fullName email")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });
    const productsWithThumbs = await attachThumbnails(products);
    res.json({ success: true, data: productsWithThumbs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminApproveProduct = async (req, res) => {
  try {
    const product = await ProductPost.findByIdAndUpdate(
      req.params.id,
      { postStatus: "approved", approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );

    const io = req.app.get("io");
    const { createNotification } = require("./notification.controller");
    await createNotification({
      recipientId: product.ownerId,
      type: "system",
      title: "Bài đăng đã được duyệt ✅",
      content: `Bài đăng "${product.title}" của bạn đã được duyệt và đang hiển thị.`,
      relatedType: "order",
      relatedId: product._id,
      link: `/san-pham/${product._id}`,
    }, io);

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminRejectProduct = async (req, res) => {
  try {
    const { reason } = req.body;
    const product = await ProductPost.findByIdAndUpdate(
      req.params.id,
      { postStatus: "rejected", rejectReason: reason || "Không đạt yêu cầu" },
      { new: true }
    );

    const io = req.app.get("io");
    const { createNotification } = require("./notification.controller");
    await createNotification({
      recipientId: product.ownerId,
      type: "system",
      title: "Bài đăng bị từ chối ❌",
      content: `Bài đăng "${product.title}" bị từ chối. Lý do: ${reason || "Không đạt yêu cầu"}`,
      link: "/quan-ly/bai-dang",
    }, io);

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminChangeStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!["pending", "approved", "rejected", "closed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const updateData = { postStatus: status };
    if (status === "approved") {
      updateData.approvedBy = req.user._id;
      updateData.approvedAt = new Date();
    } else if (status === "rejected") {
      updateData.rejectReason = reason || "Không đạt yêu cầu";
    } else if (status === "pending") {
      updateData.approvedBy = null;
      updateData.approvedAt = null;
      updateData.rejectReason = null;
    }

    const product = await ProductPost.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    // Send notifications if approved/rejected/pending
    const io = req.app.get("io");
    const { createNotification } = require("./notification.controller");
    if (status === "approved") {
      await createNotification({
        recipientId: product.ownerId,
        type: "system",
        title: "Bài đăng đã được duyệt ✅",
        content: `Bài đăng "${product.title}" của bạn đã được duyệt và đang hiển thị.`,
        relatedType: "order",
        relatedId: product._id,
        link: `/san-pham/${product._id}`,
      }, io);
    } else if (status === "rejected") {
      await createNotification({
        recipientId: product.ownerId,
        type: "system",
        title: "Bài đăng bị từ chối ❌",
        content: `Bài đăng "${product.title}" bị từ chối. Lý do: ${reason || "Không đạt yêu cầu"}`,
        link: "/quan-ly/bai-dang",
      }, io);
    } else if (status === "pending") {
      await createNotification({
        recipientId: product.ownerId,
        type: "system",
        title: "Bài đăng đang được xem xét lại ⏳",
        content: `Bài đăng "${product.title}" đã được đưa về trạng thái chờ duyệt để xem xét lại tính minh bạch.`,
        link: "/quan-ly/bai-dang",
      }, io);
    }

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getMyProducts, adminGetProducts, adminApproveProduct, adminRejectProduct, adminChangeStatus,
};
