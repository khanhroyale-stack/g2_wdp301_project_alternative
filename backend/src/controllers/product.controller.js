const Product = require("../models/product.model");
const Category = require("../models/category.model");

// GET /api/products — public, có filter/search/sort
const getProducts = async (req, res) => {
  try {
    const { keyword, category, listingType, condition, minPrice, maxPrice, sort } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const filter = { status: "ACTIVE" };
    if (keyword) filter.$text = { $search: keyword };
    if (category) filter.category = category;
    if (listingType) filter.listingType = listingType;
    if (condition) filter.condition = condition;
    if (minPrice || maxPrice) {
      filter.$or = [
        { salePrice: { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) } },
        { rentalPricePerDay: { ...(minPrice && { $gte: +minPrice }), ...(maxPrice && { $lte: +maxPrice }) } },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { salePrice: 1, rentalPricePerDay: 1 },
      price_desc: { salePrice: -1, rentalPricePerDay: -1 },
    };
    const sortQuery = sortMap[sort] || { createdAt: -1 };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("seller", "name avatar reputationScore averageRating totalTransactions")
      .populate("category", "name icon")
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
    const product = await Product.findById(req.params.id)
      .populate("seller", "name avatar reputationScore averageRating totalTransactions phone")
      .populate("category", "name icon");
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
    product.views += 1;
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products — tạo bài đăng
const createProduct = async (req, res) => {
  try {
    if (req.user.accountStatus !== "APPROVED") {
      return res.status(403).json({ success: false, message: "Tài khoản chưa được xác minh. Vui lòng đợi Admin duyệt." });
    }
    const product = await Product.create({ ...req.body, seller: req.user._id, status: "PENDING" });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    if (product.seller.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Không có quyền" });
    if (["SOLD", "RENTING"].includes(product.status))
      return res.status(400).json({ success: false, message: "Không thể sửa sản phẩm đang bán/cho thuê" });
    Object.assign(product, req.body);
    product.status = "PENDING"; // cần duyệt lại sau khi sửa
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id — ẩn bài
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy" });
    const isOwner = product.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: "Không có quyền" });
    product.status = "HIDDEN";
    await product.save();
    res.json({ success: true, message: "Đã ẩn bài đăng" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/my — bài của mình
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .populate("category", "name")
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
    const filter = status ? { status } : {};
    const products = await Product.find(filter)
      .populate("seller", "name email")
      .populate("category", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminApproveProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: "ACTIVE", approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    
    const { createNotification } = require("./notification.controller");
    await createNotification({
      recipientId: product.seller,
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
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: "REJECTED", rejectedReason: reason || "Không đạt yêu cầu" },
      { new: true }
    );

    const { createNotification } = require("./notification.controller");
    await createNotification({
      recipientId: product.seller,
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
