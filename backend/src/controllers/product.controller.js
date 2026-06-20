const ProductPost = require("../models/product_post.model");
const ProductImage = require("../models/product_image.model");
const Category = require("../models/category.model");
const {
  attachImagesToProducts,
  getProductImageUrls,
} = require("../utils/product-images.util");

const MARKETPLACE_STATUSES = ["approved"];
const ADMIN_POST_STATUSES = ["pending", "approved", "rejected", "closed"];

const normalizeProductType = (value) => {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "ban" || normalized === "sale") {
    return "sale";
  }
  if (normalized === "cho-thue" || normalized === "rent") {
    return "rent";
  }
  if (normalized === "both") {
    return "both";
  }

  return normalized;
};

const buildMarketplaceFilter = (query) => {
  const {
    category,
    condition,
    search,
    keyword,
    minPrice,
    maxPrice,
  } = query;
  const type = normalizeProductType(query.type || query.listingType || query.productType);

  const filter = { postStatus: { $in: MARKETPLACE_STATUSES } };

  if (category) {
    filter.categoryId = category;
  }

  if (condition) {
    filter.conditionStatus = condition;
  }

  if (type) {
    filter.productType = type === "sale" ? { $in: ["sale", "both"] } : type === "rent" ? { $in: ["rent", "both"] } : type;
  }

  const searchTerm = (search || keyword || "").trim();
  if (searchTerm) {
    filter.$or = [
      { title: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
    ];
  }

  const min = minPrice !== undefined && minPrice !== "" ? Number(minPrice) : null;
  const max = maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : null;
  if (min !== null || max !== null) {
    const range = {};
    if (min !== null) {
      range.$gte = min;
    }
    if (max !== null) {
      range.$lte = max;
    }

    filter.$and = [
      {
        $or: [
          { salePrice: range },
          { rentPricePerDay: range },
          { rentPricePerWeek: range },
          { rentPricePerMonth: range },
        ],
      },
    ];
  }

  return filter;
};

const mapProductPayload = (body) => {
  const payload = {};
  const fields = [
    "categoryId",
    "title",
    "description",
    "productType",
    "salePrice",
    "rentPricePerDay",
    "rentPricePerWeek",
    "rentPricePerMonth",
    "depositAmount",
    "location",
    "conditionStatus",
    "quantity",
    "invoiceField",
    "warrantyField",
    "videoField",
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  }

  if (payload.productType) {
    payload.productType = normalizeProductType(payload.productType);
  }

  for (const key of ["salePrice", "rentPricePerDay", "rentPricePerWeek", "rentPricePerMonth", "depositAmount", "quantity"]) {
    if (payload[key] !== undefined && payload[key] !== null && payload[key] !== "") {
      payload[key] = Number(payload[key]);
    }
  }

  return payload;
};

const syncProductImages = async (productId, imageIds = []) => {
  await ProductImage.deleteMany({ postId: productId });

  const normalizedIds = imageIds.filter(Boolean);
  if (!normalizedIds.length) {
    return;
  }

  await ProductImage.insertMany(
    normalizedIds.map((mediaId, index) => ({
      postId: productId,
      mediaId,
      field: mediaId,
      isThumbnail: index === 0,
      sortOrder: index,
    }))
  );
};

const getProducts = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 20, 1);
    const filter = buildMarketplaceFilter(req.query);

    const products = await ProductPost.find(filter)
      .populate("ownerId", "fullName email avatarUrl phone reputationScore")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    await attachImagesToProducts(products);

    const total = await ProductPost.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.params.id)
      .populate("ownerId", "fullName email phone avatarUrl address reputationScore")
      .populate("categoryId", "name")
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "San pham khong ton tai" });
    }

    product.images = await getProductImageUrls(product._id);
    product.thumbnailUrl = product.images[0] || null;

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: "active" }).sort({ name: 1 }).lean();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const payload = mapProductPayload(req.body);
    const imageIds = req.body.imageIds || req.body.mediaIds || [];

    const product = await ProductPost.create({
      ...payload,
      ownerId: req.user._id,
      postStatus: "pending",
    });

    await syncProductImages(product._id, Array.isArray(imageIds) ? imageIds : []);

    const createdProduct = await ProductPost.findById(product._id)
      .populate("ownerId", "fullName email avatarUrl")
      .populate("categoryId", "name")
      .lean();

    createdProduct.images = await getProductImageUrls(product._id);
    createdProduct.thumbnailUrl = createdProduct.images[0] || null;

    res.status(201).json({
      success: true,
      message: "Tao bai dang thanh cong. Bai dang dang cho duyet.",
      data: createdProduct,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Khong tim thay san pham" });
    }

    if (String(product.ownerId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Ban khong co quyen cap nhat bai dang nay" });
    }

    Object.assign(product, mapProductPayload(req.body));
    product.postStatus = "pending";
    product.approvedBy = null;
    product.approvedAt = null;
    product.rejectReason = null;
    await product.save();

    if (Array.isArray(req.body.imageIds) || Array.isArray(req.body.mediaIds)) {
      await syncProductImages(product._id, req.body.imageIds || req.body.mediaIds);
    }

    const updatedProduct = await ProductPost.findById(product._id)
      .populate("ownerId", "fullName email avatarUrl")
      .populate("categoryId", "name")
      .lean();

    updatedProduct.images = await getProductImageUrls(product._id);
    updatedProduct.thumbnailUrl = updatedProduct.images[0] || null;

    res.json({
      success: true,
      message: "Cap nhat bai dang thanh cong. Bai dang da duoc dua ve trang thai cho duyet.",
      data: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await ProductPost.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Khong tim thay san pham" });
    }

    if (String(product.ownerId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Ban khong co quyen cap nhat bai dang nay" });
    }

    product.postStatus = "closed";
    await product.save();

    res.json({ success: true, message: "Da an bai dang" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const products = await ProductPost.find({ ownerId: req.user._id })
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .lean();

    await attachImagesToProducts(products);

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminGetProducts = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { postStatus: status } : {};

    const products = await ProductPost.find(filter)
      .populate("ownerId", "fullName email phone")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .lean();

    await attachImagesToProducts(products);

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminChangeStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!ADMIN_POST_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Trang thai khong hop le" });
    }

    const update = { postStatus: status };
    if (status === "approved") {
      update.approvedBy = req.user._id;
      update.approvedAt = new Date();
      update.rejectReason = null;
    } else if (status === "rejected") {
      update.rejectReason = (reason || "").trim() || "Khong dat yeu cau";
      update.approvedBy = null;
      update.approvedAt = null;
    } else if (status === "pending") {
      update.approvedBy = null;
      update.approvedAt = null;
      update.rejectReason = null;
    }

    const product = await ProductPost.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("ownerId", "fullName email phone")
      .populate("categoryId", "name")
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Khong tim thay bai dang" });
    }

    product.images = await getProductImageUrls(product._id);
    product.thumbnailUrl = product.images[0] || null;

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminApproveProduct = async (req, res) => {
  req.body.status = "approved";
  return adminChangeStatus(req, res);
};

const adminRejectProduct = async (req, res) => {
  req.body.status = "rejected";
  return adminChangeStatus(req, res);
};

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  adminGetProducts,
  adminApproveProduct,
  adminRejectProduct,
  adminChangeStatus,
};
