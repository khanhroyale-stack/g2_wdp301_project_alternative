const ProductPost = require("../models/product_post.model");
const Category = require("../models/category.model");

// GET /api/products — public, có filter/search/sort
const getProducts = async (req, res) => {
  try {
    const { keyword, category, listingType, condition, minPrice, maxPrice, sort } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const filter = { postStatus: "approved" };
    if (keyword) filter.$text = { $search: keyword };
    if (category) filter.categoryId = category;
    
    if (listingType) {
      if (listingType === "ban") filter.productType = "sale";
      else if (listingType === "cho-thue") filter.productType = "rent";
      else filter.productType = listingType;
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
      .populate("ownerId", "name avatar reputationScore averageRating totalTransactions")
      .populate("categoryId", "name icon")
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, data: products, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.params.id)
      .populate("ownerId", "name avatar reputationScore averageRating totalTransactions phone")
      .populate("categoryId", "name icon");
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    res.json({ success: true, data: product });
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
    const product = await ProductPost.create({ ...req.body, ownerId: req.user._id, postStatus: "pending" });
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
    
    Object.assign(product, req.body);
    product.postStatus = "pending"; // cần duyệt lại sau khi sửa
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
    res.json({ success: true, data: products });
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
      .populate("ownerId", "name email")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: products });
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
    
    const { createNotification } = require("./notification.controller");
    await createNotification({
      recipientId: product.ownerId,
      title: "Bài đăng đã được duyệt ✅",
      message: `Bài đăng "${product.title}" của bạn đã được duyệt và đang hiển thị.`,
      type: "POST_APPROVED",
      link: `/san-pham/${product._id}`,
    });

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

    const { createNotification } = require("./notification.controller");
    await createNotification({
      recipientId: product.ownerId,
      title: "Bài đăng bị từ chối ❌",
      message: `Bài đăng "${product.title}" của bạn bị từ chối. Lý do: ${reason || "Không đạt yêu cầu"}`,
      type: "POST_REJECTED",
      link: "/quan-ly/bai-dang",
    });

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getMyProducts, adminGetProducts, adminApproveProduct, adminRejectProduct,
};
